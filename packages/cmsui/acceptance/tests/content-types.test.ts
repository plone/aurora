import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

const LIST = '/controlpanel/content-types';

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
    // Without the capabilities plone.restapi doesn't have yet, there's no
    // workflow column and no Addable switch.
    await expect(
      page.getByRole('columnheader', { name: 'Workflow' }),
    ).toHaveCount(0);
    await expect(page.getByRole('switch')).toHaveCount(0);
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

    // The acceptance site has two collections.
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
