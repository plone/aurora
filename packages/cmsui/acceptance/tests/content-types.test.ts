import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

type Page = Parameters<typeof test>[0]['page'];

const LIST = '/controlpanel/content-types';

/**
 * Whether the backend has `@content-types`, `@behaviors` and `@workflows`
 * (plone/plone.restapi#2061). Only then do the list rows say which workflow
 * a type uses. Needs a logged-in page.
 */
async function hasContentTypes(page: Page) {
  const response = await page.request.get('/@content-types');
  const { items } = (await response.json()) as {
    items: Array<{ workflow?: unknown }>;
  };
  return items.some((item) => item.workflow);
}

test('As an anonymous visitor, I cannot open the content types control panel', async ({
  page,
}) => {
  await page.goto(LIST);

  await expect(page).toHaveURL(/\/login/);
});

test.describe('The content types control panel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('lists the types with their item counts', async ({ page }) => {
    await page.goto(LIST, { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { level: 1, name: 'Content types' }),
    ).toBeVisible();
    const event = page.getByRole('row', { name: /^Event/ });
    await expect(event).toBeVisible();
    await expect(page.getByRole('row', { name: /^Page/ })).toBeVisible();
    if (await hasContentTypes(page)) {
      await expect(
        page.getByRole('columnheader', { name: 'Workflow' }),
      ).toBeVisible();
      await expect(event).toContainText('Simple Publication Workflow');
    } else {
      // Without the capabilities released plone.restapi doesn't have yet,
      // there's no workflow column and no Addable switch.
      await expect(
        page.getByRole('columnheader', { name: 'Workflow' }),
      ).toHaveCount(0);
      await expect(page.getByRole('switch')).toHaveCount(0);
    }
  });

  test('opens a type from its row', async ({ page }) => {
    await page.goto(LIST, { waitUntil: 'networkidle' });

    await page.getByRole('rowheader', { name: /^Event/ }).click();

    await expect(page).toHaveURL(
      /\/controlpanel\/content-types\/Event\/settings$/,
    );
    await expect(page.getByRole('heading', { name: 'Event' })).toBeVisible();
  });

  test('adds a type and goes to its fields', async ({ page }) => {
    await page.goto(LIST, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Add content type' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add content type' });
    await dialog
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('Meeting minutes');
    await expect(
      dialog.getByRole('textbox', { name: 'Short name' }),
    ).toHaveValue('meeting_minutes');
    await dialog
      .getByRole('textbox', { name: 'Description' })
      .fill('Agenda, decisions and action items.');
    await dialog.getByRole('button', { name: 'Create and add fields' }).click();

    await expect(page).toHaveURL(
      /\/controlpanel\/content-types\/meeting_minutes\/fields$/,
    );
    await expect(page.getByText('Meeting minutes created')).toBeVisible();

    await page.goto(LIST, { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('row', { name: /^Meeting minutes/ }),
    ).toBeVisible();
  });

  test('deletes a type without items', async ({ page }) => {
    await page.goto(LIST, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add content type' }).click();
    const add = page.getByRole('dialog', { name: 'Add content type' });
    await add
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('Throwaway');
    await add.getByRole('button', { name: 'Create and add fields' }).click();
    await expect(page).toHaveURL(/\/throwaway\/fields$/);
    await page.goto(LIST, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Actions for Throwaway' }).click();
    await page.getByRole('menuitem', { name: 'Delete…' }).click();
    const confirm = page.getByRole('alertdialog', {
      name: 'Delete Throwaway?',
    });
    await confirm.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Throwaway deleted')).toBeVisible();
    await expect(page.getByRole('row', { name: /^Throwaway/ })).toHaveCount(0);
  });

  test("doesn't delete a type that has items", async ({ page }) => {
    await page.goto(LIST, { waitUntil: 'networkidle' });

    // The acceptance site has two collections, plone.restapi's test site
    // none.
    const { items } = (await (
      await page.request.get('/@content-types')
    ).json()) as { items: Array<{ id: string; count: number }> };
    test.skip(
      !items.find((item) => item.id === 'Collection')?.count,
      'No collections on this site',
    );
    await page.getByRole('button', { name: 'Actions for Collection' }).click();
    await page.getByRole('menuitem', { name: 'Delete…' }).click();
    const dialog = page.getByRole('alertdialog', {
      name: 'Delete Collection?',
    });

    await expect(dialog.getByText(/Collection: \d+ items/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('row', { name: /^Collection/ })).toBeVisible();
  });

  test('redirects the Volto control panel URLs', async ({ page }) => {
    await page.goto('/controlpanel/dexterity-types');
    await expect(page).toHaveURL(/\/controlpanel\/content-types$/);

    await page.goto('/controlpanel/dexterity-types/Event/schema');
    await expect(page).toHaveURL(
      /\/controlpanel\/content-types\/Event\/fields$/,
    );
  });
});

test.describe("A content type's page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('saves the name and the description', async ({ page }) => {
    await page.goto(`${LIST}/Document/settings`, { waitUntil: 'networkidle' });

    await page
      .getByRole('textbox', { name: 'Description' })
      .fill('Pages are documents.');
    const bar = page.getByRole('region', { name: 'Unsaved changes' });
    await expect(bar).toContainText('Unsaved changes in Settings');
    await bar.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Page saved')).toBeVisible();
    await expect(bar).toHaveCount(0);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      page.getByRole('textbox', { name: 'Description' }),
    ).toHaveValue('Pages are documents.');
  });

  test('chooses which types can be added inside', async ({ page }) => {
    await page.goto(`${LIST}/Document/settings`, { waitUntil: 'networkidle' });

    const allowed = page.getByRole('radiogroup', { name: 'Allowed inside' });
    await allowed.getByText('Only selected types').click();
    await page.getByRole('combobox', { name: 'Allowed types' }).fill('Imag');
    await page.getByRole('option', { name: 'Image' }).click();
    // The list stays open to pick more, so close it.
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Page saved')).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      allowed.getByRole('radio', { name: 'Only selected types' }),
    ).toBeChecked();
    // The allowed types show as tags under the picker.
    await expect(page.getByRole('row', { name: 'Image' })).toBeVisible();
  });

  test('keeps the changes across tabs, and asks before leaving', async ({
    page,
  }) => {
    await page.goto(`${LIST}/Document/settings`, { waitUntil: 'networkidle' });
    await page.getByRole('textbox', { name: 'Description' }).fill('Changed');

    await page.getByRole('tab', { name: 'Fields' }).click();
    await expect(page).toHaveURL(/\/Document\/fields$/);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await page.getByRole('tab', { name: /Settings/ }).click();
    await expect(
      page.getByRole('textbox', { name: 'Description' }),
    ).toHaveValue('Changed');

    await page.getByRole('link', { name: 'back' }).click();
    const dialog = page.getByRole('alertdialog', {
      name: 'Leave without saving?',
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page).toHaveURL(/\/Document\/settings$/);

    await page.getByRole('link', { name: 'back' }).click();
    await dialog.getByRole('button', { name: 'Discard changes' }).click();
    await expect(page).toHaveURL(/\/controlpanel\/content-types$/);
  });

  test("doesn't offer the contents settings for a type that isn't folderish", async ({
    page,
  }) => {
    await page.goto(`${LIST}/Link/settings`, { waitUntil: 'networkidle' });
    // `@content-types` doesn't say which types are folderish yet.
    test.skip(await hasContentTypes(page), 'The backend has @content-types');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Link' }),
    ).toBeVisible();
    await expect(
      page.getByRole('radiogroup', { name: 'Allowed inside' }),
    ).toHaveCount(0);
  });

  test('opens the Settings tab without a tab in the URL', async ({ page }) => {
    await page.goto(`${LIST}/Event`);
    await expect(page).toHaveURL(/\/Event\/settings$/);
  });
});

test.describe("A content type's fields", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const fieldsIn = (page: Page, fieldset: string) =>
    page.getByRole('grid', { name: `Fields in ${fieldset}` });

  async function addField(
    page: Page,
    { label, type }: { label: string; type: string },
  ) {
    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add a field' });
    await dialog
      .getByRole('textbox', { name: 'Label', exact: true })
      .fill(label);
    await dialog.getByRole('button', { name: /Type/ }).click();
    await page.getByRole('option', { name: type, exact: true }).click();
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }

  async function save(page: Page) {
    const bar = page.getByRole('region', { name: 'Unsaved changes' });
    await expect(bar).toContainText('Unsaved changes in Fields');
    await bar.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Notes saved')).toBeVisible();
    await expect(bar).toHaveCount(0);
  }

  // Plone keeps the schemas of types in memory, so changes to a type's
  // fields outlive the backend reset between tests. Each test edits a type of
  // its own.
  async function openNewType(page: Page) {
    const id = `notes_${Date.now()}`;
    const response = await page.request.post('/@content-types', {
      data: { title: 'Notes', id },
    });
    expect(response.ok()).toBe(true);
    await page.goto(`${LIST}/${id}/fields`, { waitUntil: 'networkidle' });
  }

  test('shows the fields from behaviors as locked', async ({ page }) => {
    await page.goto(`${LIST}/Document/fields`, { waitUntil: 'networkidle' });

    await expect(
      page
        .getByRole('grid', { name: 'Fieldsets' })
        .getByRole('row', { name: 'Default' }),
    ).toHaveAttribute('aria-selected', 'true');
    const title = fieldsIn(page, 'Default').getByRole('row', {
      name: 'Title',
    });
    await expect(title).toHaveAttribute('aria-disabled', 'true');
    await expect(title).toContainText('Dublin Core metadata');
  });

  test('adds a field and a fieldset', async ({ page }) => {
    await openNewType(page);

    await page.getByRole('button', { name: 'Add fieldset' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add a fieldset' });
    await dialog
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('Sources');
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(fieldsIn(page, 'Sources')).toBeVisible();

    await addField(page, { label: 'Source URL', type: 'URL' });
    await expect(
      fieldsIn(page, 'Sources').getByRole('row', { name: 'Source URL' }),
    ).toContainText('URL · source_url');
    await save(page);

    await page.reload({ waitUntil: 'networkidle' });
    await page
      .getByRole('grid', { name: 'Fieldsets' })
      .getByRole('row', { name: 'Sources' })
      .click();
    await expect(
      fieldsIn(page, 'Sources').getByRole('row', { name: 'Source URL' }),
    ).toContainText('Custom');
  });

  const row = (page: Page, name: string) =>
    fieldsIn(page, 'Default').getByRole('row', { name });

  test('edits a custom field in a side sheet', async ({ page }) => {
    await openNewType(page);
    await addField(page, { label: 'Pages', type: 'Integer' });
    await save(page);

    await row(page, 'Pages').click();
    const sheet = page.getByRole('dialog', { name: 'Edit field' });
    await sheet
      .getByRole('textbox', { name: 'Label', exact: true })
      .fill('Page count');
    await sheet.getByText('Required').click();
    await sheet.getByRole('button', { name: 'Done' }).click();
    await save(page);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(row(page, 'Page count')).toContainText('pages · required');
  });

  test('reorders custom fields with the keyboard', async ({ page }) => {
    await openNewType(page);
    await addField(page, { label: 'Pages', type: 'Integer' });
    await addField(page, { label: 'Reviewed', type: 'Yes/No' });

    // Reorder before saving: saving reloads the schema, and the rows it
    // redraws can take the focus away from the handle.
    await row(page, 'Reviewed')
      .getByRole('button', { name: 'Reviewed' })
      .focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await save(page);

    await page.reload({ waitUntil: 'networkidle' });
    const keys = await fieldsIn(page, 'Default')
      .getByRole('row')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-key')));
    expect(keys.indexOf('reviewed')).toBeLessThan(keys.indexOf('pages'));
  });

  test('deletes a custom field', async ({ page }) => {
    await openNewType(page);
    await addField(page, { label: 'Reviewed', type: 'Yes/No' });
    await save(page);

    await row(page, 'Reviewed').click();
    const remove = page
      .getByRole('dialog', { name: 'Edit field' })
      .getByRole('button', { name: 'Delete field' });
    // The sheet slides in by scrolling, which Playwright's scrolling before
    // a click disturbs. Use the keyboard.
    await expect(remove).toBeInViewport();
    await remove.focus();
    await page.keyboard.press('Enter');
    await expect(row(page, 'Reviewed')).toHaveCount(0);
    await save(page);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(row(page, 'Reviewed')).toHaveCount(0);
  });
});

test.describe("A content type's behaviors", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const formBehaviors = (page: Page) =>
    page.getByRole('grid', { name: 'Add fields to the form' });

  async function openNewType(page: Page) {
    const id = `notes_${Date.now()}`;
    const response = await page.request.post('/@content-types', {
      data: { title: 'Notes', id },
    });
    expect(response.ok()).toBe(true);
    await page.goto(`${LIST}/${id}/behaviors`, { waitUntil: 'networkidle' });
  }

  async function save(page: Page) {
    const bar = page.getByRole('region', { name: 'Unsaved changes' });
    await expect(bar).toContainText('Unsaved changes in Behaviors');
    await bar.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Notes saved')).toBeVisible();
    await expect(bar).toHaveCount(0);
  }

  test('shows what the behaviors add', async ({ page }) => {
    await openNewType(page);

    await expect(
      formBehaviors(page).getByRole('row', { name: /Dublin Core metadata/ }),
    ).toContainText('Adds Title, Summary');
    await expect(
      page.getByRole('complementary', { name: 'Edit form preview' }),
    ).toContainText('Title');
  });

  test('adds behaviors and removes one', async ({ page }) => {
    await openNewType(page);

    await page.getByRole('button', { name: 'Add behaviors' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add behaviors to Notes' });
    // Dublin Core already has it.
    await expect(
      dialog.getByRole('checkbox', { name: /Ownership/ }),
    ).toBeDisabled();
    await dialog
      .getByRole('searchbox', { name: 'Search behaviors' })
      .fill('lead');
    await dialog.getByText('Lead Image', { exact: true }).click();
    await dialog
      .getByRole('searchbox', { name: 'Search behaviors' })
      .fill('related');
    await dialog.getByText('Related items', { exact: true }).click();
    await dialog.getByRole('button', { name: 'Add 2' }).click();
    const preview = page.getByRole('complementary', {
      name: 'Edit form preview',
    });
    if (await hasContentTypes(page)) {
      // The backend previews the form with them.
      await expect(preview).toContainText('Lead Image Caption');
      await expect(preview).toContainText('Related Items');
    } else {
      await expect(preview).toContainText(
        'Fields from Lead Image, Related items show after saving.',
      );
    }
    await save(page);

    await expect(
      formBehaviors(page).getByRole('row', { name: /Lead Image/ }),
    ).toContainText('Adds Lead Image');
    await page.getByRole('button', { name: 'Remove Related items' }).click();
    await expect(page.getByText('Related items removed')).toBeVisible();
    await save(page);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      formBehaviors(page).getByRole('row', { name: /Lead Image/ }),
    ).toBeVisible();
    await expect(
      formBehaviors(page).getByRole('row', { name: /Related items/ }),
    ).toHaveCount(0);
  });
});

// What needs `@content-types`, `@behaviors` and `@workflows`
// (plone/plone.restapi#2061). Released plone.restapi doesn't have them yet.
test.describe('A content type, on a backend with @content-types', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    test.skip(!(await hasContentTypes(page)), 'Needs plone/plone.restapi#2061');
  });

  async function openNewType(page: Page, tab: string) {
    const id = `trip_${Date.now()}`;
    const response = await page.request.post('/@content-types', {
      data: { title: 'Trip', id },
    });
    expect(response.ok()).toBe(true);
    await page.goto(`${LIST}/${id}/${tab}`, { waitUntil: 'networkidle' });
  }

  async function save(page: Page, tab: string) {
    const bar = page.getByRole('region', { name: 'Unsaved changes' });
    await expect(bar).toContainText(`Unsaved changes in ${tab}`);
    await bar.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Trip saved')).toBeVisible();
    await expect(bar).toHaveCount(0);
  }

  test('saves the visibility and versioning settings', async ({ page }) => {
    await openNewType(page, 'settings');

    await page.getByText('Show in search results', { exact: true }).click();
    await page
      .getByRole('radiogroup', { name: 'Versioning' })
      .getByText('Automatic', { exact: true })
      .click();
    await save(page, 'Settings');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      page.getByRole('switch', { name: 'Show in search results' }),
    ).not.toBeChecked();
    await expect(page.getByRole('radio', { name: /^Automatic/ })).toBeChecked();
  });

  test('copies a type', async ({ page }) => {
    await page.goto(LIST, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Add content type' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add content type' });
    const id = `event_copy_${Date.now()}`;
    await dialog
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('Event copy');
    await dialog.getByRole('textbox', { name: 'Short name' }).fill(id);
    await dialog.getByText('A copy of an existing type').click();
    await dialog.getByRole('button', { name: /Type to copy/ }).click();
    await page.getByRole('option', { name: 'Event', exact: true }).click();
    await dialog.getByRole('button', { name: 'Create and add fields' }).click();

    await expect(page).toHaveURL(new RegExp(`/${id}/fields$`));
    await page.goto(`${LIST}/${id}/behaviors`, { waitUntil: 'networkidle' });
    await expect(
      page
        .getByRole('grid', { name: 'Add fields to the form' })
        .getByRole('row', { name: /Event Basic/ }),
    ).toBeVisible();
  });

  test('saves the order of the behaviors', async ({ page }) => {
    await openNewType(page, 'behaviors');
    const list = page.getByRole('grid', { name: 'Add fields to the form' });

    await page.getByRole('button', { name: 'Add behaviors' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add behaviors to Trip' });
    await dialog
      .getByRole('searchbox', { name: 'Search behaviors' })
      .fill('lead');
    await dialog.getByText('Lead Image', { exact: true }).click();
    await dialog.getByRole('button', { name: 'Add 1' }).click();
    // Alt + ↑ moves it above Dublin Core.
    await list.getByRole('row', { name: /Lead Image/ }).focus();
    await page.keyboard.press('Alt+ArrowUp');
    await expect(list.getByRole('row').first()).toContainText('Lead Image');
    await save(page, 'Behaviors');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(list.getByRole('row').first()).toContainText('Lead Image');
  });

  test('changes the workflow', async ({ page }) => {
    await openNewType(page, 'workflow');

    await expect(
      page.getByRole('heading', { name: 'Simple Publication Workflow' }),
    ).toBeVisible();
    await expect(page.getByText('Follows the site default')).toBeVisible();
    await page.getByRole('button', { name: 'Change workflow…' }).click();
    const dialog = page.getByRole('dialog', {
      name: 'Change workflow for Trip',
    });
    await dialog
      .getByText('Intranet/Extranet Workflow', { exact: true })
      .click();
    await dialog.getByRole('button', { name: 'Next: map states' }).click();
    await expect(
      dialog.getByRole('list', { name: 'Map states' }).getByRole('listitem'),
    ).toHaveCount(3);
    await dialog.getByRole('button', { name: 'Next: review' }).click();
    await expect(dialog).toContainText(
      'Trip will use Intranet/Extranet Workflow instead of Simple Publication Workflow.',
    );
    await dialog.getByRole('button', { name: 'Change workflow' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Intranet/Extranet Workflow' }),
    ).toBeVisible();
    await expect(page.getByText('Set for this type')).toBeVisible();
  });
});
