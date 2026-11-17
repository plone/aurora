import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import {
  getValue,
  insertWithSlashMenu,
  type EditorHandle,
} from '../fixtures/editor';
import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  openInView,
  savePage,
} from '../fixtures/pages';

// In Aurora, the settings of the grid, its columns and the blocks inside
// them show in the sidebar.

const p = (text: string) => ({ type: 'p', children: [{ text }] });

const gridOf = async (page: Page, editorHandle: EditorHandle) =>
  (await getValue(page, editorHandle)).find((node) => node.type === 'grid');

const sidebarOf = (page: Page) =>
  page.getByRole('complementary', { name: 'Sidebar' });

async function openEmptyPage(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], { extra: [p('')] });
  await openInEditor(page, pageId);
  return { pageId, editorHandle: await getEditorHandle(page) };
}

test('a new grid opens its settings in the sidebar', async ({ page }) => {
  const { pageId, editorHandle } = await openEmptyPage(page);
  const sidebar = sidebarOf(page);

  await insertWithSlashMenu(page, editorHandle, 1, 'Grid');
  await expect(sidebar.getByRole('heading', { name: 'Grid' })).toBeVisible();
  await expect(sidebar.getByText('2 columns')).toBeVisible();

  await sidebar
    .getByRole('button', { name: 'Add a column at the end' })
    .click();
  await sidebar.getByText('1:2:1').click();
  await expect
    .poll(async () =>
      ((await gridOf(page, editorHandle))?.children ?? []).map(
        (column: any) => column.size,
      ),
    )
    .toEqual([1, 2, 1]);

  await sidebar.getByText('Grey', { exact: true }).click();
  await sidebar
    .getByRole('textbox', { name: 'Headline' })
    .fill('Plan your visit');
  await sidebar.getByRole('radio', { name: 'Keep in a row' }).check({
    force: true,
  });
  await expect
    .poll(async () => {
      const grid = await gridOf(page, editorHandle);
      return [grid?.theme, grid?.headline, grid?.stack];
    })
    .toEqual(['grey', 'Plan your visit', false]);

  await savePage(page);
  const stored = await getStoredValue(page, pageId);
  expect(stored.find((node: any) => node.type === 'grid')).toMatchObject({
    theme: 'grey',
    headline: 'Plan your visit',
  });
  await openInView(page, pageId);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Plan your visit' }),
  ).toBeVisible();
});

test('shows the column, and Esc goes up to the grid and the page', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  const sidebar = sidebarOf(page);

  // The caret in a paragraph of the second column shows that column.
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 1, 0, 0],
    offset: 0,
  });
  await expect(
    sidebar.getByRole('heading', { name: 'Column 2 of 2' }),
  ).toBeVisible();
  await expect(
    sidebar.getByText('Width: 1 of 3 parts, set by the grid layout.'),
  ).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(sidebar.getByRole('heading', { name: 'Grid' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    sidebar
      .getByRole('navigation', { name: 'Selection' })
      .getByText('Page', { exact: true }),
  ).toBeVisible();
});

test('a press on the gap between columns selects the grid', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInEditor(page, pageId);
  const sidebar = sidebarOf(page);

  const columns = page.locator('.slate-grid .block-grid__column');
  const first = (await columns.nth(0).boundingBox())!;
  const second = (await columns.nth(1).boundingBox())!;
  await page.mouse.click(
    (first.x + first.width + second.x) / 2,
    first.y + first.height - 4,
  );
  await expect(sidebar.getByRole('heading', { name: 'Grid' })).toBeVisible();
});

test('shows an image in a column under the levels above it', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [
      {
        type: 'grid',
        id: 'image-grid',
        theme: 'default',
        gap: 'm',
        stack: true,
        children: [
          {
            type: 'grid_column',
            id: 'text',
            size: 1,
            children: [p('Text')],
          },
          {
            type: 'grid_column',
            id: 'picture',
            size: 1,
            children: [
              {
                type: 'ploneBlock',
                '@type': 'image',
                id: 'grid-image',
                children: [{ text: '' }],
              },
            ],
          },
        ],
      },
    ],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  const sidebar = sidebarOf(page);

  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 1, 0, 0],
    offset: 0,
  });
  const crumbs = sidebar.getByRole('navigation', { name: 'Selection' });
  await expect(crumbs.getByText('Image', { exact: true })).toBeVisible();
  await expect(crumbs.getByRole('button', { name: 'Grid' })).toBeVisible();
  await expect(crumbs.getByRole('button', { name: 'Column 2' })).toBeVisible();
  await expect(sidebar.getByText('Block 1 of 1 in column 2')).toBeVisible();

  await crumbs.getByRole('button', { name: 'Column 2' }).click();
  await expect(
    sidebar.getByRole('heading', { name: 'Column 2 of 2' }),
  ).toBeVisible();
});

test('a keyboard user reaches the column settings from its handle', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['grid']);
  await openInEditor(page, pageId);
  const sidebar = sidebarOf(page);

  const handle = page.getByRole('toolbar', { name: 'Column 1 of 2' });
  await handle.getByRole('button', { name: 'Move right' }).focus();
  await expect(
    sidebar.getByRole('heading', { name: 'Column 1 of 2' }),
  ).toBeVisible();

  // Tab from the handle's last control goes into the sidebar.
  await handle.getByRole('button', { name: 'Delete column' }).focus();
  await page.keyboard.press('Tab');
  await expect(sidebar.getByRole('button', { name: 'Page' })).toBeFocused();
});
