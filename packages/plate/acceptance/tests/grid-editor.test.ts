import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import {
  getValue,
  insertWithSlashMenu,
  nodeText,
  pasteData,
  type EditorHandle,
} from '../fixtures/editor';
import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  savePage,
} from '../fixtures/pages';

// Inserting a grid and editing the blocks in its columns.

const gridOf = async (page: Page, editorHandle: EditorHandle) =>
  (await getValue(page, editorHandle)).find((node) => node.type === 'grid');

const columnTexts = async (page: Page, editorHandle: EditorHandle) =>
  ((await gridOf(page, editorHandle))?.children ?? []).map((column: any) =>
    column.children.map((block: any) => nodeText(block)),
  );

async function openEmptyPage(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  await openInEditor(page, pageId);
  return { pageId, editorHandle: await getEditorHandle(page) };
}

test('inserts a grid with the caret in its first column', async ({ page }) => {
  const { pageId, editorHandle } = await openEmptyPage(page);

  await insertWithSlashMenu(page, editorHandle, 1, 'Grid');
  await page.keyboard.type('Left');

  await expect
    .poll(() => columnTexts(page, editorHandle))
    .toEqual([['Left'], ['']]);

  // Enter makes a new block inside the same column.
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second');
  await expect
    .poll(() => columnTexts(page, editorHandle))
    .toEqual([['Left', 'Second'], ['']]);

  // The arrow keys at the end of a column go to the next one.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.type('Right');
  await expect
    .poll(() => columnTexts(page, editorHandle))
    .toEqual([['Left', 'Second'], ['Right']]);

  await savePage(page);
  const stored = await getStoredValue(page, pageId);
  const grid = stored.find((node: any) => node.type === 'grid') as any;
  expect(grid.children.map((column: any) => column.size)).toEqual([1, 1]);
});

test('shows the empty column hint and names the columns', async ({ page }) => {
  const { editorHandle } = await openEmptyPage(page);
  await insertWithSlashMenu(page, editorHandle, 1, 'Grid');

  const columns = page.getByRole('group', { name: /^Column \d of 2$/ });
  await expect(columns).toHaveCount(2);
  await expect(
    page.getByRole('group', { name: 'Column 2 of 2' }),
  ).toContainText('Type / to add a block');
});

test('only offers the blocks a column can hold, and never a grid', async ({
  page,
}) => {
  const { editorHandle } = await openEmptyPage(page);
  await insertWithSlashMenu(page, editorHandle, 1, 'Grid');

  await page.keyboard.type('/');
  await expect(
    page.getByRole('option', { name: 'Heading 2', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: 'Grid', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('option', { name: 'Accordion', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Grids can't be placed inside a grid."),
  ).toBeVisible();
  await page.keyboard.press('Escape');
});

test('keeps the columns apart with Backspace', async ({ page }) => {
  const { editorHandle } = await openEmptyPage(page);
  await insertWithSlashMenu(page, editorHandle, 1, 'Grid');
  await page.keyboard.type('Left');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Backspace');

  await expect
    .poll(() => columnTexts(page, editorHandle))
    .toEqual([['Left'], ['']]);
});

test('unwraps a grid pasted into a column', async ({ page }) => {
  const { editorHandle } = await openEmptyPage(page);
  await insertWithSlashMenu(page, editorHandle, 1, 'Grid');

  const fragment = [
    {
      type: 'grid',
      id: 'pasted',
      theme: 'default',
      gap: 'm',
      stack: true,
      children: [
        {
          type: 'grid_column',
          id: 'pasted-a',
          size: 1,
          children: [{ type: 'p', children: [{ text: 'Pasted A' }] }],
        },
        {
          type: 'grid_column',
          id: 'pasted-b',
          size: 1,
          children: [{ type: 'p', children: [{ text: 'Pasted B' }] }],
        },
      ],
    },
  ];
  await pasteData(page, editorHandle, {
    'application/x-slate-fragment': Buffer.from(
      encodeURIComponent(JSON.stringify(fragment)),
    ).toString('base64'),
  });

  await expect
    .poll(async () => (await columnTexts(page, editorHandle)).length)
    .toBe(2);
  const grids = (await getValue(page, editorHandle)).filter(
    (node) => node.type === 'grid',
  );
  expect(grids).toHaveLength(1);
  expect((await columnTexts(page, editorHandle))[0]).toEqual(
    expect.arrayContaining(['Pasted A', 'Pasted B']),
  );
});
