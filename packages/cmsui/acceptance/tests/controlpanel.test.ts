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
  await page.goto('/controlpanel/socialmedia');

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
