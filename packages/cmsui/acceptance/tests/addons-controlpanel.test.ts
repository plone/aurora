import { expect, test, type Page } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

const group = (page: Page, name: 'Installed' | 'Available') =>
  page.getByRole('region', { name: new RegExp(`^${name}`) });

const row = (page: Page, title: string) =>
  page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });

test('As an anonymous visitor, I cannot open the add-ons control panel', async ({
  page,
}) => {
  await page.goto('/controlpanel/addons');

  await expect(page).toHaveURL(/\/login/);
});

test('As a site administrator, I can open the add-ons control panel from the site setup', async ({
  page,
}) => {
  await login(page);
  await page.goto('/controlpanel');

  await page.getByRole('link', { name: 'Add-ons', exact: true }).click();

  await expect(page).toHaveURL(/\/controlpanel\/addons$/);
  await expect(page.locator('h1', { hasText: 'Add-ons' })).toBeVisible();
});

test('As a site administrator, I can install an add-on', async ({ page }) => {
  await login(page);
  // Wait for hydration, otherwise pressing a button does nothing.
  await page.goto('/controlpanel/addons', { waitUntil: 'networkidle' });

  const title = 'Session refresh support';
  await expect(row(page, title)).toBeVisible();
  await expect(
    group(page, 'Available').getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();

  await row(page, title).getByRole('button', { name: 'Install' }).click();

  await expect(
    group(page, 'Installed').getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    group(page, 'Available').getByRole('heading', { name: title, exact: true }),
  ).toHaveCount(0);
});

test('As a site administrator, I am asked before an add-on is uninstalled', async ({
  page,
}) => {
  await login(page);
  await page.goto('/controlpanel/addons', { waitUntil: 'networkidle' });

  const title = 'Discussion Support';
  await expect(
    group(page, 'Installed').getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();

  const openUninstall = async () => {
    await page.getByRole('button', { name: `Actions for ${title}` }).click();
    await page.getByRole('menuitem', { name: 'Uninstall' }).click();
    return page.getByRole('dialog', { name: `Uninstall ${title}?` });
  };

  // Cancelling keeps it installed.
  let dialog = await openUninstall();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    group(page, 'Installed').getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();

  dialog = await openUninstall();
  await dialog.getByRole('button', { name: 'Uninstall' }).click();

  await expect(
    group(page, 'Available').getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    group(page, 'Installed').getByRole('heading', { name: title, exact: true }),
  ).toHaveCount(0);
});

test('As a site administrator, I can find an add-on', async ({ page }) => {
  await login(page);
  await page.goto('/controlpanel/addons', { waitUntil: 'networkidle' });

  await page.getByRole('searchbox', { name: 'Find an add-on' }).fill('session');

  await expect(row(page, 'Session refresh support')).toBeVisible();
  await expect(row(page, 'Discussion Support')).toHaveCount(0);

  await page.getByRole('searchbox', { name: 'Find an add-on' }).fill('nothing');
  await expect(page.getByText('No add-ons match your search.')).toBeVisible();
});
