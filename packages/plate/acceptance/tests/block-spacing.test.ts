import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';

// The block model's spatial relationships (the stack of blocks, category
// widths, the spacing between blocks, nested blocks) come from
// `@plone/layout`'s `content.css`, which both the Public UI and the editor
// load. Every block is flush at the top, and its gap is its own bottom
// padding, so a block's background includes it. A block must be spaced the
// same in both.

/** Blocks to measure, by name. */
const BLOCKS: Record<string, string> = {
  title: '.slate-title',
  heading: '[data-block-type="h2"]',
  // The last paragraph of the headings section: no heading follows it.
  paragraph: '[data-block-type="h4"] + [data-block-type="p"]',
  'before a heading': '.block:has(+ [data-block-type="h3"])',
  'before the separator': '.block:has(+ [data-block-type="hr"])',
  callout: '[data-block-type="callout"]',
  table: '[data-block-type="table"]',
  blockquote: '[data-block-type="blockquote"]',
  'nested paragraph':
    '[data-block-type="blockquote"] [data-block-type="p"]:first-child',
  'last nested paragraph':
    '[data-block-type="blockquote"] [data-block-type="p"]:last-child',
};

/** The block's own properties: it's flush at the top, then its gap. */
const BLOCK_PROPERTIES = [
  'margin-top',
  'margin-bottom',
  'padding-top',
  'padding-bottom',
];

/** Its inner container's properties: the width, and no margins. */
const INNER_PROPERTIES = [
  'max-width',
  'margin-top',
  'margin-bottom',
  'justify-items',
];

type Spacing = {
  block: Record<string, string>;
  inner: Record<string, string>;
};

const measureSpacing = (page: Page) =>
  page.locator('[data-slate-editor]').evaluate(
    (root, { blocks, blockProperties, innerProperties }) => {
      const read = (element: Element, properties: string[]) => {
        const style = getComputedStyle(element);
        return Object.fromEntries(
          properties.map((property) => [
            property,
            style.getPropertyValue(property),
          ]),
        );
      };
      return Object.fromEntries(
        Object.entries(blocks).map(([name, selector]) => {
          const block = root.querySelector(selector);
          // The editor wraps the inner container of some blocks, so it isn't
          // always a direct child.
          const inner = block?.querySelector('.block-inner-container');
          if (!block || !inner) return [name, null];
          return [
            name,
            {
              block: read(block, blockProperties),
              inner: read(inner, innerProperties),
            },
          ];
        }),
      ) as Record<string, Spacing | null>;
    },
    {
      blocks: BLOCKS,
      blockProperties: BLOCK_PROPERTIES,
      innerProperties: INNER_PROPERTIES,
    },
  );

const gap = (spacing: Spacing | null) =>
  parseFloat(spacing?.block['padding-bottom'] ?? 'NaN');

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
    expect(spacing!.block['margin-top'], `${name} has no margin`).toBe('0px');
    expect(spacing!.block['margin-bottom'], `${name} has no margin`).toBe(
      '0px',
    );
    expect(spacing!.block['padding-top'], `${name} is flush at the top`).toBe(
      '0px',
    );
    expect(spacing!.inner['margin-top'], `${name}'s content is flush`).toBe(
      '0px',
    );
    expect(spacing!.inner['margin-bottom'], `${name}'s content is flush`).toBe(
      '0px',
    );
  }

  // The gaps: the default after a block, more room before a heading, none
  // before the separator nor after the last block in a container.
  const paragraphGap = gap(inView.paragraph);
  expect(paragraphGap).toBeGreaterThan(0);
  expect(gap(inView['before a heading'])).toBeGreaterThan(paragraphGap);
  expect(gap(inView['before the separator'])).toBe(0);
  expect(gap(inView['nested paragraph'])).toBe(paragraphGap);
  expect(gap(inView['last nested paragraph'])).toBe(0);

  await openInEditor(page, pageId);
  expect(await measureSpacing(page)).toEqual(inView);
});
