import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

test('The edit form resolves image and boolean fields to their widgets', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'News Item',
    contentId: 'widget-news',
    contentTitle: 'Widget news',
  });

  await page.goto('/@@edit/widget-news', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();

  // The lead image is an `Image` factory field.
  await expect(
    page.getByText('Browse the site, drop an image, or use a URL'),
  ).toBeVisible();

  // Boolean fields resolve by their `boolean` type.
  await page.locator('button', { hasText: /^Settings$/ }).click();
  await expect(
    page.locator('label', { hasText: 'Exclude from navigation' }),
  ).toBeVisible();
  await expect(
    page.locator('input[type="checkbox"][name="exclude_from_nav"]'),
  ).toHaveCount(1);
});

test('A page summary is edited in a multi-line text area', async ({ page }) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'summary-page',
    contentTitle: 'Summary page',
  });

  await page.goto('/@@edit/summary-page', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();

  // plone.restapi sends `widget: 'textarea'` for the description field.
  const summary = page.getByRole('textbox', { name: 'Summary' });
  await expect(summary).toBeVisible();
  expect(await summary.evaluate((element) => element.tagName)).toBe('TEXTAREA');
});
