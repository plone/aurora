import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import {
  focusBlockStart,
  getBlock,
  nodeText,
  type EditorHandle,
} from '../fixtures/editor';
import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';

// The title block can be removed from a page. Editors can add it back from
// the slash menu, or with the `# ` markdown shortcut, which only applies while
// the page has no title block (there is no H1: the title is the page's H1).
async function openPageWithoutTitle(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    title: 'Removed title',
    withTitle: false,
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  await focusBlockStart(page, editorHandle, 0);

  return editorHandle;
}

async function expectRestoredTitle(
  page: Page,
  editorHandle: EditorHandle,
  text: string,
) {
  await expect
    .poll(async () => (await getBlock(page, editorHandle, 0))?.type)
    .toBe('title');
  await expect
    .poll(async () => nodeText(await getBlock(page, editorHandle, 0)))
    .toBe(text);

  // The restored title block drives the page title.
  await page.getByRole('tab', { name: 'Content' }).click();
  await expect(page.locator('input[name="title"]').first()).toHaveValue(text);
}

test('Typing "# " restores the title block when there is none', async ({
  page,
}) => {
  const editorHandle = await openPageWithoutTitle(page);
  await page.keyboard.type('# Restored title');

  await expectRestoredTitle(page, editorHandle, 'Restored title');
});

test('The slash menu restores the title block when there is none', async ({
  page,
}) => {
  const editorHandle = await openPageWithoutTitle(page);
  await page.keyboard.type('/title');
  await page.getByRole('option', { name: 'Title', exact: true }).click();
  await page.keyboard.type('Restored title');

  await expectRestoredTitle(page, editorHandle, 'Restored title');
});

test('Typing "# " is left as typed while the title block exists', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  await focusBlockStart(page, editorHandle, 1);
  await page.keyboard.type('# Not a title');

  await expect
    .poll(async () => nodeText(await getBlock(page, editorHandle, 1)))
    .toBe('# Not a title');
  expect((await getBlock(page, editorHandle, 1))?.type).toBe('p');
  expect((await getBlock(page, editorHandle, 0))?.type).toBe('title');
});
