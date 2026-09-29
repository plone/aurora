import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { getBlock, getValue, nodeText } from '../fixtures/editor';

const TEXT = 'Context menu paragraph';

async function openContextMenu(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [
      { type: 'p', children: [{ text: TEXT }] },
      { type: 'p', children: [{ text: 'Last paragraph' }] },
    ],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  await page
    .locator('[data-slate-editor]')
    .getByText(TEXT, { exact: true })
    .click({ button: 'right' });
  await expect(page.getByRole('menu')).toBeVisible();

  return editorHandle;
}

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
