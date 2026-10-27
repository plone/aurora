import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorText } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { getBlock, type EditorHandle } from '../fixtures/editor';

const TEXT = 'Floating toolbar text';

async function openWithSelection(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: TEXT }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  await selectBlockText(page, editorHandle);
  const toolbar = page.getByLabel('Editor toolbar');
  await expect(toolbar).toBeVisible();
  return { editorHandle, toolbar };
}

async function selectBlockText(page: Page, editorHandle: EditorHandle) {
  await selectPlateEditorText(
    page,
    editorHandle,
    {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: TEXT.length },
    },
    TEXT,
  );
}

const marks = [
  { button: /^Bold/, mark: 'bold' },
  { button: /^Italic/, mark: 'italic' },
  { button: /^Strikethrough/, mark: 'strikethrough' },
  { button: /^Code/, mark: 'code' },
];

for (const { button, mark } of marks) {
  test(`Floating toolbar applies the ${mark} mark`, async ({ page }) => {
    const { editorHandle, toolbar } = await openWithSelection(page);

    await toolbar.getByLabel(button).click();

    await expect
      .poll(async () => (await getBlock(page, editorHandle, 1))?.children?.[0])
      .toEqual({ text: TEXT, [mark]: true });
  });
}

const blockButtons = [
  {
    name: 'Bulleted list',
    check: (block: Record<string, unknown>) => block.listStyleType === 'disc',
  },
  {
    name: 'Numbered list',
    check: (block: Record<string, unknown>) =>
      block.listStyleType === 'decimal',
  },
  {
    name: 'Todo',
    check: (block: Record<string, unknown>) => block.listStyleType === 'todo',
  },
  {
    name: 'Toggle',
    check: (block: Record<string, unknown>) => block.type === 'toggle',
  },
];

for (const { name, check } of blockButtons) {
  test(`Floating toolbar "${name}" button converts the block`, async ({
    page,
  }) => {
    const { editorHandle, toolbar } = await openWithSelection(page);

    await toolbar.getByLabel(name, { exact: true }).click();

    await expect
      .poll(async () => check((await getBlock(page, editorHandle, 1)) ?? {}))
      .toBe(true);
  });
}

const turnInto = [
  { label: 'Heading 2', type: 'h2' },
  { label: 'Heading 3', type: 'h3' },
  { label: 'Heading 4', type: 'h4' },
  { label: 'Heading 5', type: 'h5' },
  { label: 'Heading 6', type: 'h6' },
  { label: 'Quote', type: 'blockquote' },
  { label: 'Code', type: 'code_block' },
  { label: '3 columns', type: 'column_group' },
];

for (const { label, type } of turnInto) {
  test(`Floating toolbar "Turn into" converts to ${label}`, async ({
    page,
  }) => {
    const { editorHandle, toolbar } = await openWithSelection(page);

    await toolbar.getByLabel('Turn into').click();
    await page.getByRole('menuitemradio', { name: label, exact: true }).click();

    await expect
      .poll(async () => (await getBlock(page, editorHandle, 1))?.type)
      .toBe(type);
  });
}

test('Floating toolbar does not offer AI commands in the Aurora preset', async ({
  page,
}) => {
  const { toolbar } = await openWithSelection(page);

  await expect(toolbar.getByLabel(/AI/)).toHaveCount(0);
  await expect(toolbar.getByText(/Ask AI/)).toHaveCount(0);
});
