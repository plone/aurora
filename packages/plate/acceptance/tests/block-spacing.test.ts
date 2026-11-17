import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';

// The block model's spatial relationships (category widths, the spacing
// between blocks, nested blocks) come from `@plone/layout`'s `content.css`,
// which both the Public UI and the editor load. A block must be spaced the
// same in both.

/** Inner containers to compare, by the block they belong to. */
const BLOCKS: Record<string, string> = {
  heading: '[data-block-type="h2"]',
  paragraph: '[data-block-type="p"]:not([data-list-style-type])',
  'before the separator': '.block:has(+ [data-block-type="hr"])',
  callout: '[data-block-type="callout"]',
  table: '[data-block-type="table"]',
  'nested paragraph': '[data-block-type="blockquote"] [data-block-type="p"]',
};

const PROPERTIES = [
  'max-width',
  'padding-bottom',
  'margin-top',
  'margin-bottom',
  'justify-items',
];

const measureSpacing = (page: Page) =>
  page.locator('[data-slate-editor]').evaluate(
    (root, { blocks, properties }) =>
      Object.fromEntries(
        Object.entries(blocks).map(([name, selector]) => {
          const container = root
            .querySelector(selector)
            ?.querySelector(':scope > .block-inner-container');
          if (!container) return [name, null];
          const style = getComputedStyle(container);
          return [
            name,
            Object.fromEntries(
              properties.map((property) => [
                property,
                style.getPropertyValue(property),
              ]),
            ),
          ];
        }),
      ),
    { blocks: BLOCKS, properties: PROPERTIES },
  );

test('blocks are spaced the same in the editor and the public view', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [
    'headings',
    'blockquote',
    'table',
    'callout',
    'hr',
  ]);

  await openInView(page, pageId);
  const inView = await measureSpacing(page);
  for (const [name, spacing] of Object.entries(inView)) {
    expect(spacing, `${name} renders in the view`).not.toBeNull();
  }

  await openInEditor(page, pageId);
  expect(await measureSpacing(page)).toEqual(inView);
});
