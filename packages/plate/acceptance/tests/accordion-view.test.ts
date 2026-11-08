import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createNativeBlocksPage } from '../fixtures/pages';

// The published view of the accordion block: panels open and close from their
// title, only one at a time, and links to a panel's anchor open it.

test.beforeEach(async ({ page }) => {
  await login(page);
});

// Waits for hydration, otherwise clicks on the titles are lost.
async function openPublishedView(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.locator('[data-slate-editor]').first().waitFor();
}

test('opens and closes panels from their title', async ({ page }) => {
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openPublishedView(page, `/${pageId}`);

  const openingHours = page.getByRole('button', { name: 'Opening hours' });
  const findUs = page.getByRole('button', { name: 'How to find us' });

  // The panel marked to start open is open on load.
  await expect(openingHours).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('region', { name: 'Opening hours' }),
  ).toContainText('Monday to Friday');
  await expect(findUs).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('Take the tram to Central Square.')).toBeHidden();

  // Only one panel is open at a time.
  await findUs.click();
  await expect(findUs).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByText('Take the tram to Central Square.'),
  ).toBeVisible();
  await expect(openingHours).toHaveAttribute('aria-expanded', 'false');

  // The keyboard works too.
  await openingHours.focus();
  await page.keyboard.press('Enter');
  await expect(openingHours).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Space');
  await expect(openingHours).toHaveAttribute('aria-expanded', 'false');
});

test('opens the panel a link points to', async ({ page }) => {
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openPublishedView(page, `/${pageId}#how-to-find-us`);

  await expect(
    page.getByRole('button', { name: 'How to find us' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByText('Take the tram to Central Square.'),
  ).toBeVisible();
});

test('does not show empty text blocks', async ({ page }) => {
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openPublishedView(page, `/${pageId}`);

  const region = page.getByRole('region', { name: 'Opening hours' });
  await expect(region.locator('.slate-p')).toHaveCount(2);
  await expect(region.locator('.slate-p').nth(1)).toBeHidden();
});

test('sets the background of its theme', async ({ page }) => {
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openPublishedView(page, `/${pageId}`);

  await expect(
    page.locator('.slate-accordion > .block-inner-container'),
  ).toHaveCSS('background-color', 'rgb(236, 235, 235)');
});
