import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import {
  measureOwnedStyles,
  plainElementMargin,
  removeBaseLayer,
  SIMPLE_RESET,
} from '../../../tooling/playwright/resets';
import { createNativeBlocksPage, openInView } from '../fixtures/pages';

// The lists' styles come from `styles/content.css`. They must render the
// same whatever reset the public theme brings. Without a reset, browsers give
// lists their own margins and padding, and buttons their own look.

const CHECKBOX = [
  'position',
  'top',
  'left',
  'width',
  'height',
  'padding',
  'border-width',
  'border-style',
  'border-color',
  'margin',
  'appearance',
  'background-color',
  'border-radius',
];

/** The properties the list styles set, per element. */
const OWNED: Record<string, string[]> = {
  '[data-list-style-type="disc"] .block-p__list': [
    'position',
    'padding',
    'margin',
  ],
  '[data-list-style-type="decimal"] .block-p__list': [
    'position',
    'padding',
    'margin',
  ],
  '[data-list-style-type="todo"] .block-p__item': ['list-style-type'],
  '.block-p__item[data-checked]': ['color', 'text-decoration-line'],
  '.block-p__checkbox:not([data-state="checked"])': CHECKBOX,
  '.block-p__checkbox[data-state="checked"]': [...CHECKBOX, 'color'],
  '.block-p__checkmark svg': ['width', 'height'],
};

test('the lists render the same under any public theme reset', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['lists']);
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
