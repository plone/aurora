import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import {
  measureOwnedStyles,
  plainElementMargin,
  removeBaseLayer,
  SIMPLE_RESET,
} from '../../../tooling/playwright/resets';
import { INLINE_MARKS } from '../fixtures/inline-marks';
import { createNativeBlocksPage, openInView } from '../fixtures/pages';

// The inline marks' and elements' styles come from `styles/content.css`. They
// must render the same whatever reset the public theme brings. Without a
// reset, browsers style `code`, `kbd` and `mark` themselves.

const FONT = ['font-family', 'font-size', 'line-height'];

/** The properties the inline styles set, per element. */
const OWNED: Record<string, string[]> = {
  '.slate-code': [
    'padding',
    'border-radius',
    'background-color',
    'white-space',
    ...FONT,
  ],
  '.slate-kbd': [
    'padding',
    'border-width',
    'border-style',
    'border-color',
    'border-radius',
    'background-color',
    ...FONT,
  ],
  // Its `color: inherit` follows the paragraph, so it's checked separately.
  '.slate-highlight': ['background-color'],
  '.slate-a': [
    'color',
    'font-weight',
    'text-decoration-line',
    'text-decoration-color',
    'text-underline-offset',
  ],
  '.slate-mention': [
    'display',
    'padding',
    'border-radius',
    'background-color',
    'font-size',
    'font-weight',
    'line-height',
    'vertical-align',
  ],
  '.slate-mention[data-bold]': ['font-weight'],
};

const measure = (page: Page) => measureOwnedStyles(page, OWNED);

// The highlight keeps the color of the text around it, whatever the reset.
const highlightFollowsText = (page: Page) =>
  page
    .locator('[data-slate-editor] .slate-highlight')
    .evaluate(
      (mark) =>
        getComputedStyle(mark).color ===
        getComputedStyle(mark.parentElement!).color,
    );

test('the inline marks render the same under any public theme reset', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: INLINE_MARKS,
  });
  await openInView(page, pageId);

  const withPreflight = await measure(page);
  expect(await highlightFollowsText(page)).toBe(true);
  for (const [selector, styles] of Object.entries(withPreflight)) {
    expect(styles, `${selector} renders`).not.toBeNull();
  }

  // No reset: the browser's default styles apply.
  expect(await removeBaseLayer(page)).toBeGreaterThan(0);
  expect(await plainElementMargin(page, 'blockquote')).toBe('16px 40px');
  expect(await measure(page)).toEqual(withPreflight);
  expect(await highlightFollowsText(page)).toBe(true);

  // A different reset.
  await page.addStyleTag({ content: SIMPLE_RESET });
  expect(await plainElementMargin(page, 'h1')).toBe('21.44px 0px');
  expect(await measure(page)).toEqual(withPreflight);
  expect(await highlightFollowsText(page)).toBe(true);
});
