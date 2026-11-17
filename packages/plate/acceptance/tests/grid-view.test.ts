import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createNativeBlocksPage, openInView } from '../fixtures/pages';

// The published view of the grid block: columns side by side with their
// width weights, a headline, a background, and stacking on the grid's own
// width.

const columnBoxes = (page: Page) =>
  page.locator('.slate-grid .block-grid__column').evaluateAll((columns) =>
    columns.map((column) => {
      const box = column.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('shows the columns side by side, sized by their weights', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInView(page, pageId);

  const grid = page.locator('.slate-grid');
  await expect(
    grid.getByRole('heading', { level: 2, name: 'Plan your visit' }),
  ).toBeVisible();

  const [visit, tours] = await columnBoxes(page);
  // Side by side, the same height, the first twice as wide as the second.
  expect(Math.round(visit.y)).toBe(Math.round(tours.y));
  expect(tours.x).toBeGreaterThan(visit.x + visit.width);
  expect(Math.round(visit.height)).toBe(Math.round(tours.height));
  expect(visit.width / tours.width).toBeCloseTo(2, 0);
});

test('colors the whole grid with its background theme', async ({ page }) => {
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInView(page, pageId);

  const grid = page.locator('.slate-grid');
  await expect(grid).toHaveAttribute('data-style-theme', 'grey');
  const inner = grid.locator('> .block-inner-container');
  await expect(inner).toHaveCSS('background-color', 'rgb(236, 235, 235)');
  // The headline is inside the colored area.
  const headline = await grid.locator('.block-grid__headline').boundingBox();
  const area = await inner.boundingBox();
  expect(headline!.y).toBeGreaterThan(area!.y);
});

test('stacks the columns when the grid is narrow', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 900 });
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInView(page, pageId);

  const [visit, tours] = await columnBoxes(page);
  expect(tours.y).toBeGreaterThanOrEqual(visit.y + visit.height);
  expect(Math.round(tours.x)).toBe(Math.round(visit.x));
});

test('keeps the columns in a row when stacking is off', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 900 });
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [
      {
        type: 'grid',
        id: 'row-grid',
        theme: 'default',
        gap: 's',
        stack: false,
        children: [
          {
            type: 'grid_column',
            id: 'one',
            size: 1,
            children: [{ type: 'p', children: [{ text: 'One' }] }],
          },
          {
            type: 'grid_column',
            id: 'two',
            size: 1,
            children: [{ type: 'p', children: [{ text: 'Two' }] }],
          },
        ],
      },
    ],
  });
  await openInView(page, pageId);

  const [one, two] = await columnBoxes(page);
  expect(Math.round(one.y)).toBe(Math.round(two.y));
  expect(two.x).toBeGreaterThan(one.x);
});
