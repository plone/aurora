import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import {
  measureOwnedStyles,
  plainElementMargin,
  removeBaseLayer,
  SIMPLE_RESET,
} from '../../../tooling/playwright/resets';
import { createNativeBlocksPage, openInView } from '../fixtures/pages';

// The styles of the callout, toggle, columns, table of contents and the
// content root come from `styles/content.css`. They must render the same
// whatever reset the public theme brings. Without a reset, browsers give
// buttons their own look and `svg` an inline display.
//
// Sizes that follow the text aren't compared: removing the reset also removes
// the theme's font, which the content inherits.

/** The properties the structural styles set, per element. */
const OWNED: Record<string, string[]> = {
  '.slate-title': ['margin-left', 'margin-right'],
  strong: ['font-weight'],

  '.slate-callout > .block-inner-container': [
    'display',
    'padding-top',
    'padding-left',
    'border-radius',
    'background-color',
  ],
  '.block-callout__body': ['display', 'gap', 'border-radius'],
  // Its width follows the emoji's glyph.
  '.block-callout__icon': ['height', 'font-family', 'font-size', 'user-select'],

  '.slate-toggle > .block-inner-container': ['position', 'padding-left'],
  '.block-toggle__icon': [
    'position',
    'top',
    'left',
    'width',
    'height',
    'padding',
    'border-radius',
    'color',
    'cursor',
  ],
  '.block-toggle__icon svg': ['display', 'width', 'height', 'vertical-align'],

  '.block-inner-container:has(> .block-column_group__row)': ['margin-bottom'],
  '.block-column_group__row': ['display', 'border-radius'],
  '.block-column_group__column': ['position'],
  '.block-column_group__column:first-child > .slate-column': ['padding'],
  '.block-column_group__column:last-child > .slate-column': ['padding'],
  '.block-column__content': [
    'position',
    'padding',
    'border-top-width',
    'border-top-style',
    'border-top-color',
  ],

  '.slate-toc > .block-inner-container': ['padding-top', 'padding-left'],
  '.block-toc__item': [
    'display',
    'overflow',
    'padding',
    'margin',
    'border-top-width',
    'border-radius',
    'appearance',
    'background-color',
    'color',
    'cursor',
    'font-size',
    'font-weight',
    'line-height',
    'text-align',
    'text-decoration-line',
    'text-overflow',
    'white-space',
  ],
  '.block-toc__item[data-depth="2"]': ['padding-left'],
  '.block-toc__item[data-depth="3"]': ['padding-left'],
};

/** The properties the content root's own rule sets. */
const measureRoot = (page: Page) =>
  page.locator('[data-slate-editor]').evaluate((root) => {
    const style = getComputedStyle(root);
    return [
      'position',
      'overflow',
      'border-radius',
      'cursor',
      'overflow-wrap',
      'user-select',
      'white-space',
    ].map((property) => style.getPropertyValue(property));
  });

test('the structural blocks render the same under any public theme reset', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [
    'headings',
    'marks',
    'callout',
    'toggle',
    'columns',
    'toc',
  ]);
  await openInView(page, pageId);

  const withPreflight = await measureOwnedStyles(page, OWNED);
  for (const [selector, styles] of Object.entries(withPreflight)) {
    expect(styles, `${selector} renders`).not.toBeNull();
  }
  const rootWithPreflight = await measureRoot(page);

  // No reset: the browser's default styles apply.
  expect(await removeBaseLayer(page)).toBeGreaterThan(0);
  expect(await plainElementMargin(page, 'blockquote')).toBe('16px 40px');
  expect(await measureOwnedStyles(page, OWNED)).toEqual(withPreflight);
  expect(await measureRoot(page)).toEqual(rootWithPreflight);

  // A different reset.
  await page.addStyleTag({ content: SIMPLE_RESET });
  expect(await plainElementMargin(page, 'h1')).toBe('21.44px 0px');
  expect(await measureOwnedStyles(page, OWNED)).toEqual(withPreflight);
  expect(await measureRoot(page)).toEqual(rootWithPreflight);
});
