import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import {
  measureOwnedStyles,
  plainElementMargin,
  removeBaseLayer,
  SIMPLE_RESET,
} from '../../../tooling/playwright/resets';
import { createNativeBlocksPage, openInView } from '../fixtures/pages';

// The code block's styles come from `styles/content.css`. They must render the
// same whatever reset the public theme brings. Without a reset, browsers give
// `pre` a margin and `code` a smaller monospace font; `@plone/theming`'s simple
// reset wraps the lines of a `pre`.

/** The properties the code block styles set, per element. */
const OWNED: Record<string, string[]> = {
  '.slate-code_block': ['padding', 'margin'],
  '.block-code_block__frame': [
    'position',
    'width',
    'border-radius',
    'background-color',
  ],
  '.block-code_block__pre': [
    'overflow-x',
    'padding',
    'margin',
    'font-family',
    'font-size',
    'line-height',
    'tab-size',
    'white-space',
  ],
  '.block-code_block__pre code': [
    'font-family',
    'font-size',
    'line-height',
    'font-weight',
  ],
  '.hljs-keyword': ['color'],
  '.hljs-title': ['color'],
  '.hljs-string': ['color'],
};

test('the code block renders the same under any public theme reset', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['codeBlock']);
  await openInView(page, pageId);

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
