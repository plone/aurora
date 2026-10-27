import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

test('As an anonymous visitor, I cannot open a control panel', async ({
  page,
}) => {
  await page.goto('/controlpanel/socialmedia');

  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('As a site administrator, I can save a control panel', async ({
  page,
}) => {
  await login(page);
  // Wait for hydration, otherwise the typed values never reach the form state.
  await page.goto('/controlpanel/socialmedia', { waitUntil: 'networkidle' });

  await expect(page.locator('h1', { hasText: 'Social Media' })).toBeVisible();

  await page.getByLabel('Twitter username').fill('plone');
  await page.getByLabel('Facebook username').fill('plonecms');
  const shareSocialData = page.getByRole('checkbox', {
    name: 'Share social data',
  });
  await expect(shareSocialData).toBeChecked();
  await shareSocialData.uncheck({ force: true });
  await expect(shareSocialData).not.toBeChecked();

  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/controlpanel/socialmedia'),
  );
  await page.getByLabel('Save').click();
  await saved;

  await page.reload();
  await expect(page.getByLabel('Twitter username')).toHaveValue('plone');
  await expect(page.getByLabel('Facebook username')).toHaveValue('plonecms');
  await expect(
    page.getByRole('checkbox', { name: 'Share social data' }),
  ).not.toBeChecked();
});

test('As a site administrator, I can go back to the control panels overview', async ({
  page,
}) => {
  await login(page);
  await page.goto('/controlpanel/socialmedia');

  await page.getByLabel('back').click();
  await expect(page).toHaveURL(/\/controlpanel$/);
});

test('As a site administrator, I can edit a second control panel after opening another one', async ({
  page,
}) => {
  await login(page);
  await page.goto('/controlpanel/mail', { waitUntil: 'networkidle' });
  await expect(page.getByLabel('SMTP server')).toHaveValue('localhost');

  // Navigate client-side, so the app and its form state are not reloaded.
  // The marker on `window` would not survive a full page load.
  await page.evaluate(() => ((window as any).__sameDocument = true));
  await page.getByLabel('back').click();
  await expect(page).toHaveURL(/\/controlpanel$/);
  await page.getByRole('link', { name: 'Site', exact: true }).click();
  await expect(page).toHaveURL(/\/controlpanel\/site$/);

  expect(await page.evaluate(() => (window as any).__sameDocument)).toBe(true);

  const siteTitle = page.getByLabel('Site title');
  await expect(siteTitle).toHaveValue('Plone site');

  await siteTitle.fill('Renamed site');
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/controlpanel/site'),
  );
  await page.getByLabel('Save').click();
  await saved;

  await page.reload();
  await expect(page.getByLabel('Site title')).toHaveValue('Renamed site');
});
