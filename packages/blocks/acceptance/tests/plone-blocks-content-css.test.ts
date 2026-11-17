import { expect, test } from '../../../tooling/playwright/test';
import {
  measureOwnedStyles,
  plainElementMargin,
  removeBaseLayer,
  SIMPLE_RESET,
} from '../../../tooling/playwright/resets';
import { createPloneBlocksPage, routeEmbeds } from '../fixtures/plone-blocks';

// The video and maps blocks' styles come from `styles/content.css`. They must
// render the same whatever reset the public theme brings. Without a reset,
// browsers give `figure` a margin and `iframe` an inline display and a border.

const IFRAME = [
  'display',
  'width',
  'height',
  'border-top-width',
  'border-top-style',
  'aspect-ratio',
];

/** The properties the video and maps styles set, per element. */
const OWNED: Record<string, string[]> = {
  '.block-video__wrapper': ['width'],
  '.block-video__figure': ['width', 'margin'],
  '.block-video__inner': ['width'],
  '.block-video__figure iframe': IFRAME,
  '.block-maps__frame': ['width'],
  '.block-maps__iframe': IFRAME,
};

test('the video and maps blocks render the same under any public theme reset', async ({
  page,
}) => {
  await routeEmbeds(page);
  const pageId = await createPloneBlocksPage(page);
  await page.goto(`/${pageId}`);
  await expect(page.locator('[data-slate-editor] iframe')).toHaveCount(2);

  const withPreflight = await measureOwnedStyles(page, OWNED);
  for (const [selector, styles] of Object.entries(withPreflight)) {
    expect(styles, `${selector} renders`).not.toBeNull();
  }

  // No reset: the browser's default styles apply.
  expect(await removeBaseLayer(page)).toBeGreaterThan(0);
  expect(await plainElementMargin(page, 'blockquote')).toBe('16px 40px');
  expect(await measureOwnedStyles(page, OWNED)).toEqual(withPreflight);

  // A different reset.
  await page.addStyleTag({ content: SIMPLE_RESET });
  expect(await plainElementMargin(page, 'h1')).toBe('21.44px 0px');
  expect(await measureOwnedStyles(page, OWNED)).toEqual(withPreflight);
});
