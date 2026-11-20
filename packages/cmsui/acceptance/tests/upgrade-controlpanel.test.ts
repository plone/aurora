import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

test('As an anonymous visitor, I cannot open the Plone upgrade control panel', async ({
  page,
}) => {
  await page.goto('/@@controlpanel/plone-upgrade');

  await expect(page).toHaveURL(/\/login/);
});

test('As a site administrator, I can see the configuration versions of the site', async ({
  page,
}) => {
  await login(page);
  await page.goto('/@@controlpanel/plone-upgrade');

  await expect(
    page.locator('h1', { hasText: 'Upgrade Plone site' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Configuration versions' }),
  ).toBeVisible();
  await expect(page.getByText('Current active configuration')).toBeVisible();
  await expect(page.getByText('Latest available configuration')).toBeVisible();
});
