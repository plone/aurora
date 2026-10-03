import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import {
  plainElementMargin,
  removeBaseLayer,
} from '../../../tooling/playwright/resets';
import { createNativeBlocksPage, openInView } from '../fixtures/pages';

// The text blocks' styles come from `styles/content.css`. They must render
// the same whatever reset the public theme brings: Tailwind's preflight (as in
// Agave), a different reset, or none.

/** The properties the text block styles set, per element. */
const OWNED: Record<string, string[]> = {
  '.slate-title': [
    'margin',
    'padding',
    'font-size',
    'font-weight',
    'line-height',
  ],
  '.slate-p': ['margin', 'padding'],
  '.slate-h2': [
    'position',
    'margin',
    'padding',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
  ],
  '.slate-h3': [
    'position',
    'margin',
    'padding',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
  ],
  '.slate-h4': [
    'position',
    'margin',
    'padding',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
  ],
  '.slate-blockquote': ['margin'],
  '.slate-blockquote > .block-inner-container': [
    'margin-top',
    'margin-bottom',
    'padding-left',
    'border-left-width',
    'border-left-style',
    'font-style',
  ],
  '.block-hr__spacer': ['padding'],
  '.block-hr__line': [
    'height',
    'margin',
    'border-style',
    'border-radius',
    'background-color',
  ],
};

const measure = (page: Page) =>
  page.evaluate((owned) => {
    return Object.fromEntries(
      Object.entries(owned).map(([selector, properties]) => {
        const element = document.querySelector(
          `[data-slate-editor] ${selector}`,
        );
        if (!element) return [selector, null];
        const style = getComputedStyle(element);
        return [
          selector,
          Object.fromEntries(
            properties.map((property) => [
              property,
              style.getPropertyValue(property),
            ]),
          ),
        ];
      }),
    );
  }, OWNED);

// A real non-Tailwind reset, `@plone/theming`'s simple reset, moved into the
// `base` layer where themes are expected to put their reset.
const SIMPLE_RESET = readFileSync(
  fileURLToPath(
    new URL('../../../theming/styles/simple/reset.css', import.meta.url),
  ),
  'utf-8',
).replace('@layer reset {', '@layer base {');

test('the text blocks render the same under any public theme reset', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [
    'headings',
    'blockquote',
    'hr',
  ]);
  await openInView(page, pageId);

  const withPreflight = await measure(page);
  for (const [selector, styles] of Object.entries(withPreflight)) {
    expect(styles, `${selector} renders`).not.toBeNull();
  }
  expect(await plainElementMargin(page, 'blockquote')).toBe('0px');

  // No reset: the browser's default styles apply.
  expect(await removeBaseLayer(page)).toBeGreaterThan(0);
  expect(await plainElementMargin(page, 'blockquote')).toBe('16px 40px');
  expect(await measure(page)).toEqual(withPreflight);

  // A different reset.
  await page.addStyleTag({ content: SIMPLE_RESET });
  expect(await plainElementMargin(page, 'h1')).toBe('21.44px 0px');
  expect(await measure(page)).toEqual(withPreflight);
});
