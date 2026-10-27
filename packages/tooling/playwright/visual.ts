import type { Page } from '@playwright/test';

/**
 * Waits until the page is visually stable: no pending network requests, web
 * fonts loaded, and images decoded and painted. Animations and the caret are
 * disabled by the visual config's `toHaveScreenshot` defaults.
 */
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Images use `decoding="async"`: Chrome can paint a quick, rougher scale
    // of a large image before the full decode. Lazy images that haven't
    // started loading are skipped, since they never would.
    const images = [...document.images].filter(
      (image) => image.complete || image.loading !== 'lazy',
    );
    await Promise.all(
      images.map((image) => image.decode().catch(() => undefined)),
    );
    // Two frames: the decoded images are painted in the next one.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
}
