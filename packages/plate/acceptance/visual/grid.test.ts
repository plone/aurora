import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';
import { settle } from './helpers';

// The grid in the editor, with its column handle and an insert point, its
// settings in the sidebar, and its published view in a row and stacked.

async function openGrid(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  // The caret in the first column, so its handle shows.
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 0],
    offset: 0,
  });
  const grid = page.locator('.slate-grid');
  await expect(
    page.getByRole('toolbar', { name: 'Column 1 of 2' }),
  ).toBeVisible();
  return { pageId, grid };
}

test('Grid in the editor, with a column handle and an insert point', async ({
  page,
}) => {
  const { grid } = await openGrid(page);
  // Hovering the gap shows its insert point.
  await page
    .getByRole('button', { name: 'Insert a column at position 2' })
    .hover();
  await settle(page);

  await expect(grid).toHaveScreenshot('grid-editor-handle.png');
});

test('Grid settings in the sidebar', async ({ page }) => {
  await openGrid(page);
  await page.keyboard.press('Escape');
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
  await expect(sidebar.getByRole('heading', { name: 'Grid' })).toBeVisible();
  await settle(page);

  await expect(sidebar).toHaveScreenshot('grid-settings-sidebar.png');
});

test('Grid published view, in a row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInView(page, pageId);
  await settle(page);

  await expect(page.locator('.slate-grid')).toHaveScreenshot(
    'grid-view-row.png',
  );
});

test('Grid published view, stacked', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInView(page, pageId);
  await settle(page);

  await expect(page.locator('.slate-grid')).toHaveScreenshot(
    'grid-view-stacked.png',
  );
});
