import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import {
  getBlock,
  getValue,
  nodeText,
  type EditorHandle,
} from '../fixtures/editor';

const TEXT = 'Context menu paragraph';
const LAST = 'Last paragraph';

/** Right-clicks the paragraph containing `text` and waits for the menu. */
async function rightClickBlock(page: Page, text: string) {
  await page
    .locator('[data-slate-editor]')
    .getByText(text, { exact: true })
    .click({ button: 'right' });
  await expect(page.getByRole('menu')).toBeVisible();
}

/** Texts of the non-empty top-level blocks after the title. */
async function blockTexts(page: Page, editorHandle: EditorHandle) {
  return (await getValue(page, editorHandle))
    .slice(1)
    .map(nodeText)
    .filter(Boolean);
}

async function openContextMenu(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [
      { type: 'p', children: [{ text: TEXT }] },
      { type: 'p', children: [{ text: LAST }] },
    ],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  await rightClickBlock(page, TEXT);

  return editorHandle;
}

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

test('Block context menu lists its actions in order', async ({ page }) => {
  await openContextMenu(page);

  await expect(page.getByRole('menu').first().getByRole('menuitem')).toHaveText(
    [
      'Cut',
      'Copy',
      'Paste',
      'Duplicate',
      'Delete',
      'Turn into',
      'Indent',
      'Outdent',
      'Align',
    ],
  );
});

test('Block context menu copies a block to the clipboard', async ({ page }) => {
  const editorHandle = await openContextMenu(page);

  await page.getByRole('menuitem', { name: 'Copy', exact: true }).click();

  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain(TEXT);
  expect(await blockTexts(page, editorHandle)).toEqual([TEXT, LAST]);
});

test('Block context menu copies and pastes a block after the target', async ({
  page,
}) => {
  const editorHandle = await openContextMenu(page);

  await page.getByRole('menuitem', { name: 'Copy', exact: true }).click();
  await rightClickBlock(page, LAST);
  await page.getByRole('menuitem', { name: 'Paste', exact: true }).click();

  await expect
    .poll(() => blockTexts(page, editorHandle))
    .toEqual([TEXT, LAST, TEXT]);
});

test('Block context menu cuts and pastes a block after the target', async ({
  page,
}) => {
  const editorHandle = await openContextMenu(page);

  await page.getByRole('menuitem', { name: 'Cut', exact: true }).click();

  await expect.poll(() => blockTexts(page, editorHandle)).toEqual([LAST]);
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain(TEXT);

  await rightClickBlock(page, LAST);
  await page.getByRole('menuitem', { name: 'Paste', exact: true }).click();

  await expect.poll(() => blockTexts(page, editorHandle)).toEqual([LAST, TEXT]);
});

test('Block context menu keeps block attributes through copy and paste', async ({
  page,
}) => {
  const editorHandle = await openContextMenu(page);

  await page.getByRole('menuitem', { name: 'Turn into' }).hover();
  await page.getByRole('menuitem', { name: 'Heading 3', exact: true }).click();
  await expect
    .poll(async () => (await getBlock(page, editorHandle, 1))?.type)
    .toBe('h3');

  await rightClickBlock(page, TEXT);
  await page.getByRole('menuitem', { name: 'Copy', exact: true }).click();
  await rightClickBlock(page, LAST);
  await page.getByRole('menuitem', { name: 'Paste', exact: true }).click();

  await expect
    .poll(async () => {
      const block = await getBlock(page, editorHandle, 3);
      return block && `${block.type} ${nodeText(block)}`;
    })
    .toBe(`h3 ${TEXT}`);
});

test('Block context menu pastes text copied outside the editor', async ({
  page,
}) => {
  const editorHandle = await openContextMenu(page);
  await page.keyboard.press('Escape');
  await page.evaluate(() =>
    navigator.clipboard.writeText('Text from another app'),
  );

  await rightClickBlock(page, LAST);
  await page.getByRole('menuitem', { name: 'Paste', exact: true }).click();

  await expect
    .poll(() => blockTexts(page, editorHandle))
    .toEqual([TEXT, LAST, 'Text from another app']);
});

const turnInto = [
  { label: 'Heading 2', type: 'h2' },
  { label: 'Heading 3', type: 'h3' },
  { label: 'Heading 4', type: 'h4' },
  { label: 'Heading 5', type: 'h5' },
  { label: 'Heading 6', type: 'h6' },
  { label: 'Blockquote', type: 'blockquote' },
];

for (const { label, type } of turnInto) {
  test(`Block context menu turns a paragraph into ${label}`, async ({
    page,
  }) => {
    const editorHandle = await openContextMenu(page);

    await page.getByRole('menuitem', { name: 'Turn into' }).hover();
    await page.getByRole('menuitem', { name: label, exact: true }).click();

    await expect
      .poll(async () => (await getBlock(page, editorHandle, 1))?.type)
      .toBe(type);
    expect(nodeText(await getBlock(page, editorHandle, 1))).toBe(TEXT);
  });
}

test('Block context menu does not offer Heading 1, reserved for the title', async ({
  page,
}) => {
  await openContextMenu(page);

  await page.getByRole('menuitem', { name: 'Turn into' }).hover();
  await expect(
    page.getByRole('menuitem', { name: 'Heading 2', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Heading 1', exact: true }),
  ).toHaveCount(0);
});

for (const align of ['center', 'right'] as const) {
  test(`Block context menu aligns a paragraph ${align}`, async ({ page }) => {
    const editorHandle = await openContextMenu(page);

    await page.getByRole('menuitem', { name: 'Align' }).hover();
    await page
      .getByRole('menuitem', {
        name: align === 'center' ? 'Center' : 'Right',
        exact: true,
      })
      .click();

    await expect
      .poll(async () => (await getBlock(page, editorHandle, 1))?.align)
      .toBe(align);
  });
}

test('Block context menu indents a paragraph', async ({ page }) => {
  const editorHandle = await openContextMenu(page);

  await page.getByRole('menuitem', { name: 'Indent', exact: true }).click();

  await expect
    .poll(async () => (await getBlock(page, editorHandle, 1))?.indent)
    .toBe(1);
});

test('Block context menu duplicates a block', async ({ page }) => {
  const editorHandle = await openContextMenu(page);

  await page.getByRole('menuitem', { name: 'Duplicate' }).click();

  await expect
    .poll(async () =>
      (await getValue(page, editorHandle)).filter(
        (node) => nodeText(node) === TEXT,
      ),
    )
    .toHaveLength(2);
});

test('Block context menu deletes a block', async ({ page }) => {
  const editorHandle = await openContextMenu(page);

  await page.getByRole('menuitem', { name: 'Delete' }).click();

  await expect
    .poll(async () =>
      (await getValue(page, editorHandle)).some(
        (node) => nodeText(node) === TEXT,
      ),
    )
    .toBe(false);
});

test('Block context menu does not offer AI in the Aurora preset', async ({
  page,
}) => {
  await openContextMenu(page);

  await expect(page.getByRole('menuitem', { name: /AI/ })).toHaveCount(0);
});
