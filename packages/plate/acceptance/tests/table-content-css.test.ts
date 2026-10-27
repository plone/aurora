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

// The table's styles come from `styles/content.css`. They must render the same
// whatever reset the public theme brings. Without a reset, browsers give cells
// a padding, header cells a bold weight and centered text, and tables a
// border spacing.

const CELL = [
  'height',
  'overflow',
  'box-sizing',
  'padding',
  'border-top-style',
  'background-color',
];

/** The properties the table styles set, per element. */
const OWNED: Record<string, string[]> = {
  '.slate-table': ['padding', 'margin'],
  '.block-table__scroll': ['overflow-x', 'overflow-y'],
  // Their widths follow the text, and so the theme's font.
  '.block-table__wrapper': ['position'],
  '.block-table__table': [
    'display',
    'height',
    'border-collapse',
    'margin',
    'table-layout',
    'text-indent',
  ],
  '.block-table__table tbody': ['min-width'],
  '.slate-tr': ['height'],
  '.slate-th': [...CELL, 'font-weight', 'text-align'],
  '.slate-td': CELL,
  '.block-table__cell-content': [
    'position',
    'z-index',
    'height',
    'box-sizing',
    'padding',
  ],
};

/** The cell borders, drawn by each cell's `::before`. */
const measureCellBorders = (page: Page) =>
  page
    .locator('[data-slate-editor] :is(.slate-th, .slate-td)')
    .evaluateAll((cells) =>
      cells.map((cell) => {
        const style = getComputedStyle(cell, '::before');
        // Its size follows the cell's, which follows the theme's font.
        const cellWidth = cell.getBoundingClientRect().width;
        return [
          Math.abs(parseFloat(style.width) - cellWidth) < 0.5,
          ...[
            'content',
            'position',
            'box-sizing',
            'border-top',
            'border-right',
            'border-bottom',
            'border-left',
          ].map((property) => style.getPropertyValue(property)),
        ];
      }),
    );

test('the table renders the same under any public theme reset', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['table']);
  await openInView(page, pageId);

  const withPreflight = await measureOwnedStyles(page, OWNED);
  for (const [selector, styles] of Object.entries(withPreflight)) {
    expect(styles, `${selector} renders`).not.toBeNull();
  }
  const bordersWithPreflight = await measureCellBorders(page);
  expect(bordersWithPreflight).toHaveLength(4);
  for (const [fillsTheCell] of bordersWithPreflight) {
    expect(fillsTheCell).toBe(true);
  }

  // No reset: the browser's default styles apply.
  expect(await removeBaseLayer(page)).toBeGreaterThan(0);
  expect(await plainElementMargin(page, 'blockquote')).toBe('16px 40px');
  expect(await measureOwnedStyles(page, OWNED)).toEqual(withPreflight);
  expect(await measureCellBorders(page)).toEqual(bordersWithPreflight);

  // A different reset.
  await page.addStyleTag({ content: SIMPLE_RESET });
  expect(await plainElementMargin(page, 'h1')).toBe('21.44px 0px');
  expect(await measureOwnedStyles(page, OWNED)).toEqual(withPreflight);
  expect(await measureCellBorders(page)).toEqual(bordersWithPreflight);
});
