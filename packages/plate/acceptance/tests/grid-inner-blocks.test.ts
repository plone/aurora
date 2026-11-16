import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';

// The blocks inside a grid follow their column.

const DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const imageBlock = {
  type: 'ploneBlock',
  '@type': 'image',
  id: 'grid-image',
  url: DATA_URI,
  alt: 'A gallery',
  align: 'left',
  size: 'm',
  children: [{ text: '' }],
};
const gridWithImage = {
  type: 'grid',
  id: 'inner-grid',
  theme: 'default',
  gap: 'm',
  stack: true,
  children: [
    { type: 'grid_column', id: 'wide', size: 2, children: [p('Text')] },
    { type: 'grid_column', id: 'narrow', size: 1, children: [imageBlock] },
  ],
};

test('an image in a column offers no size or alignment, until it moves out', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [gridWithImage, p('After')],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });

  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 1, 0, 0],
    offset: 0,
  });
  await expect(sidebar.getByText(/its column's width/)).toBeVisible();
  await expect(sidebar.getByText('Alignment', { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText('Image size', { exact: true })).toHaveCount(0);
  await expect(sidebar.getByLabel('Alt text')).toBeVisible();

  // Out of the grid, the image offers its settings again and keeps them.
  await page.evaluate((editor: any) => {
    editor.tf.moveNodes({ at: [1, 1, 0], to: [2] });
    editor.tf.select(editor.api.start([2]));
  }, editorHandle);
  await expect(sidebar.getByText('Alignment', { exact: true })).toBeVisible();
  const moved = await page.evaluate(
    (editor: any) => editor.children[2],
    editorHandle,
  );
  expect(moved).toMatchObject({ '@type': 'image', align: 'left', size: 'm' });
});

test('an image in a column asks for a file that fits the column', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [gridWithImage],
  });
  await openInView(page, pageId);

  const img = page.locator('.slate-grid .block-grid__column img');
  await expect(img).toHaveAttribute('sizes', '(max-width: 40rem) 100vw, 34vw');
});
