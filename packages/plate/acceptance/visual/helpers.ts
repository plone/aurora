import type { Page } from '@playwright/test';

/**
 * Waits until the page is visually stable: no pending network requests and
 * web fonts loaded. Animations and the caret are disabled by the visual
 * config's `toHaveScreenshot` defaults.
 */
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}
