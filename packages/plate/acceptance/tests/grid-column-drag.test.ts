import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import { getValue, nodeText, type EditorHandle } from '../fixtures/editor';
import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';

// Reordering grid columns by dragging their grip.

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const column = (id: string, size: number, text: string) => ({
  type: 'grid_column',
  id,
  size,
  children: [p(text)],
});
const grid = (id: string, ...columns: object[]) => ({
  type: 'grid',
  id,
  theme: 'default',
  gap: 'm',
  stack: true,
  children: columns,
});

const columnsOf = async (page: Page, editorHandle: EditorHandle, index = 0) =>
  (
    (await getValue(page, editorHandle)).filter((node) => node.type === 'grid')[
      index
    ]?.children ?? []
  ).map((item: any) => `${nodeText(item)}:${item.size}`);

/**
 * Drags a grip onto a side of a target. Playwright's mouse emulation stalls
 * inside a real browser drag session, so this dispatches the drag events
 * with one shared DataTransfer, as the browser does.
 */
async function dragGrip(
  grip: Locator,
  target: Locator,
  side: 'left' | 'right',
) {
  await grip.evaluate(
    (source, [dropTarget, where]) => {
      const element = dropTarget as Element;
      const dataTransfer = new DataTransfer();
      const box = element.getBoundingClientRect();
      const at = {
        clientX: where === 'right' ? box.right - 2 : box.left + 2,
        clientY: box.top + box.height / 2,
      };
      const fire = (node: Element, type: string, point = {}) =>
        node.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            ...point,
          }),
        );
      fire(source, 'dragstart');
      fire(element, 'dragenter', at);
      fire(element, 'dragover', at);
      fire(element, 'drop', at);
      fire(source, 'dragend');
    },
    [await target.elementHandle(), side] as const,
  );
}

/** The first block of a column: a full-width drop target. */
const paragraphOf = (page: Page, gridIndex: number, columnIndex: number) =>
  page
    .locator('.slate-grid')
    .nth(gridIndex)
    .locator('.block-grid__column')
    .nth(columnIndex)
    .locator('[data-slate-node="element"]')
    .first();

async function openGrids(page: Page, ...grids: Record<string, unknown>[]) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], { extra: grids });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 0, 0],
    offset: 0,
  });
  return editorHandle;
}

test('drags a column after another one, with its weight', async ({ page }) => {
  const editorHandle = await openGrids(
    page,
    grid('g', column('a', 2, 'A'), column('b', 1, 'B'), column('c', 1, 'C')),
  );

  const grip = page.getByRole('button', { name: 'Drag to reorder column 1' });
  const third = paragraphOf(page, 0, 2);
  await dragGrip(grip, third, 'right');

  await expect
    .poll(() => columnsOf(page, editorHandle))
    .toEqual(['B:1', 'C:1', 'A:2']);
  await expect(page.locator('[data-plate-announcer]')).toContainText(
    'Column moved to position 3 of 3',
  );

  // One undo step puts it back.
  await page.keyboard.press('ControlOrMeta+z');
  await expect
    .poll(() => columnsOf(page, editorHandle))
    .toEqual(['A:2', 'B:1', 'C:1']);
});

test('ignores a drop on another grid', async ({ page }) => {
  const editorHandle = await openGrids(
    page,
    grid('one', column('a', 1, 'A'), column('b', 1, 'B')),
    grid('two', column('x', 1, 'X'), column('y', 1, 'Y')),
  );

  const grip = page.getByRole('button', { name: 'Drag to reorder column 1' });
  const other = paragraphOf(page, 1, 1);
  await dragGrip(grip.first(), other, 'right');

  await expect
    .poll(() => columnsOf(page, editorHandle, 1))
    .toEqual(['X:1', 'Y:1']);
  expect(await columnsOf(page, editorHandle, 0)).toEqual(['A:1', 'B:1']);
});

test('gives no drag handle to other blocks', async ({ page }) => {
  await openGrids(page, grid('g', column('a', 1, 'A')), p('Paragraph'));
  await expect(page.getByRole('button', { name: /^Drag to move/ })).toHaveCount(
    0,
  );
});
