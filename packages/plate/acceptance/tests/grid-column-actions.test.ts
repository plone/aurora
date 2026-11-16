import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import { getValue, nodeText, type EditorHandle } from '../fixtures/editor';
import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  savePage,
} from '../fixtures/pages';

// Adding, moving, duplicating and deleting the columns of a grid.

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const column = (id: string, size: number, text: string) => ({
  type: 'grid_column',
  id,
  size,
  children: [p(text)],
});
const grid = (...columns: object[]) => ({
  type: 'grid',
  id: 'actions-grid',
  theme: 'default',
  gap: 'm',
  stack: true,
  children: columns,
});

const columnTexts = async (page: Page, editorHandle: EditorHandle) =>
  (
    (await getValue(page, editorHandle)).find((node) => node.type === 'grid')
      ?.children ?? []
  ).map((item: any) => nodeText(item));

const columnSizes = async (page: Page, editorHandle: EditorHandle) =>
  (
    (await getValue(page, editorHandle)).find((node) => node.type === 'grid')
      ?.children ?? []
  ).map((item: any) => item.size);

async function openGrid(page: Page, ...columns: object[]) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [grid(...columns), p('After')],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  // The caret in the first column, so its handle shows.
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 0, 0],
    offset: 0,
  });
  return { pageId, editorHandle };
}

const handle = (page: Page, name: string) =>
  page.getByRole('toolbar', { name });

test('adds columns in a gap and at the edges', async ({ page }) => {
  const { editorHandle } = await openGrid(
    page,
    column('a', 2, 'A'),
    column('b', 1, 'B'),
  );

  await page
    .getByRole('button', { name: 'Insert a column at position 2' })
    .click();
  await expect
    .poll(() => columnTexts(page, editorHandle))
    .toEqual(['A', '', 'B']);
  await page.keyboard.type('New');
  await expect
    .poll(() => columnTexts(page, editorHandle))
    .toEqual(['A', 'New', 'B']);

  await page
    .getByRole('button', { name: 'Insert a column at position 1' })
    .click();
  await expect
    .poll(() => columnSizes(page, editorHandle))
    .toEqual([1, 2, 1, 1]);

  // With 4 columns, no more can be added.
  await expect(
    page.getByRole('button', { name: /^Insert a column/ }),
  ).toHaveCount(0);
});

test('moves a column with its handle and with the keyboard', async ({
  page,
}) => {
  const { pageId, editorHandle } = await openGrid(
    page,
    column('a', 2, 'A'),
    column('b', 1, 'B'),
    column('c', 1, 'C'),
  );

  await handle(page, 'Column 1 of 3')
    .getByRole('button', { name: 'Move right' })
    .click();
  await expect
    .poll(() => columnTexts(page, editorHandle))
    .toEqual(['B', 'A', 'C']);
  await expect(page.locator('[data-plate-announcer]')).toContainText(
    'Column moved to position 2 of 3',
  );

  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 1, 0, 0],
    offset: 0,
  });
  await page.keyboard.press('Alt+Shift+ArrowRight');
  await expect
    .poll(() => columnTexts(page, editorHandle))
    .toEqual(['B', 'C', 'A']);

  await savePage(page);
  const stored = await getStoredValue(page, pageId);
  const saved = stored.find((node: any) => node.type === 'grid') as any;
  expect(saved.children.map((item: any) => item.size)).toEqual([1, 1, 2]);
});

test('duplicates a column with new IDs', async ({ page }) => {
  const { editorHandle } = await openGrid(page, column('a', 2, 'A'));

  await handle(page, 'Column 1 of 1')
    .getByRole('button', { name: 'Duplicate column' })
    .click();
  await expect.poll(() => columnTexts(page, editorHandle)).toEqual(['A', 'A']);
  const ids = (
    (await getValue(page, editorHandle)).find((node) => node.type === 'grid')
      ?.children ?? []
  ).map((item: any) => item.id);
  expect(new Set(ids).size).toBe(2);
  await expect.poll(() => columnSizes(page, editorHandle)).toEqual([2, 2]);
});

test('deletes a column with Undo, and never the only one', async ({ page }) => {
  const { editorHandle } = await openGrid(
    page,
    column('a', 1, 'A'),
    column('b', 1, 'B'),
  );

  await handle(page, 'Column 2 of 2')
    .getByRole('button', { name: 'Delete column' })
    .click();
  await expect.poll(() => columnTexts(page, editorHandle)).toEqual(['A']);
  await expect(
    handle(page, 'Column 1 of 1').getByRole('button', {
      name: 'A grid needs at least one column',
    }),
  ).toBeDisabled();

  await page
    .locator('[data-sonner-toast]')
    .getByRole('button', { name: 'Undo' })
    .click();
  await expect.poll(() => columnTexts(page, editorHandle)).toEqual(['A', 'B']);
});

test('hides the handle while text is selected', async ({ page }) => {
  const { editorHandle } = await openGrid(
    page,
    column('a', 1, 'Some text'),
    column('b', 1, 'B'),
  );
  await expect(handle(page, 'Column 1 of 2')).toHaveCount(1);

  await page.evaluate((editor: any) => {
    editor.tf.select({
      anchor: { path: [1, 0, 0, 0], offset: 0 },
      focus: { path: [1, 0, 0, 0], offset: 4 },
    });
  }, editorHandle);
  await expect(handle(page, 'Column 1 of 2')).toHaveCount(0);
});
