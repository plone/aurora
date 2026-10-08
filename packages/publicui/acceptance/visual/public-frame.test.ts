import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { settle } from '../../../tooling/playwright/visual';

// The site frame (header, navigation, breadcrumbs, footer) as anonymous
// visitors see it, and the toolbar's add menu for editors. The block content
// itself is covered by the native blocks screenshots in @plone/plate.

test.beforeEach(async ({ page }) => {
  await createContent(page, {
    contentType: 'Document',
    contentId: 'chrome-page',
    contentTitle: 'Chrome page',
    transition: 'publish',
  });
});

test('Site frame for anonymous visitors', async ({ page }) => {
  await page.goto('/chrome-page');
  await expect(page.locator('h1', { hasText: 'Chrome page' })).toBeVisible();
  await settle(page);

  await expect(page).toHaveScreenshot('site-frame-anonymous.png', {
    fullPage: true,
  });
});

test('Toolbar add menu', async ({ page }) => {
  await login(page);
  await page.goto('/chrome-page');
  await page
    .getByRole('navigation', { name: 'Toolbar' })
    .getByRole('button')
    .click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await settle(page);

  await expect(page).toHaveScreenshot('toolbar-add-menu.png');
});
