import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { settle } from '../../../tooling/playwright/visual';

// The contents view loads its own stylesheets on top of the CMS UI ones
// (`@plone/components` basic and quanta), so it gets its own screenshot.

test('Contents listing', async ({ page }) => {
  await createContent(page, {
    contentType: 'Document',
    contentId: 'chrome-page',
    contentTitle: 'Chrome page',
    transition: 'publish',
  });
  await login(page);
  await page.goto('/@@contents');
  await expect(page.getByRole('link', { name: /Chrome page/ })).toBeVisible();
  await settle(page);

  await expect(page).toHaveScreenshot('contents-listing.png', {
    // Modification and publication dates change on every run. Mask the whole
    // cell, so the mask doesn't change size with the text.
    mask: [page.locator('td').filter({ hasText: /\d+\/\d+\/\d+, \d+:\d+/ })],
  });
});
