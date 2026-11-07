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
