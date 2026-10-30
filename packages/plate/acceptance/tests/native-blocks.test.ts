import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import {
  focusBlockStart,
  getBlock,
  getValue,
  nodeText,
  type EditorNode,
} from '../fixtures/editor';

const editable = (page: Page) => page.locator('[data-slate-editor]');

test('Toggle shows and hides its content', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['toggle']);
  await openInEditor(page, pageId);

  const content = editable(page).getByText('Content inside the toggle.');
  const button = page.getByRole('button', { name: 'Toggle content' });

  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(content).toBeHidden();

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(content).toBeVisible();

  await button.click();
  await expect(content).toBeHidden();
});

test('To-do checkbox toggles the checked state', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['lists']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  const findTodo = async () =>
    (await getValue(page, editorHandle)).find(
      (node) => nodeText(node) === 'To-do pending',
    );
  expect((await findTodo())?.checked).toBe(false);

  // Two to-dos in the fixture: the first one is unchecked.
  const checkbox = editable(page).getByRole('checkbox').first();
  await checkbox.click();

  await expect.poll(async () => (await findTodo())?.checked).toBe(true);
  await expect(checkbox).toBeChecked();
});

const tableShape = (table: EditorNode | null) => ({
  rows: table?.children?.length ?? 0,
  columns: table?.children?.[0]?.children?.length ?? 0,
});

const tableActions = [
  { label: 'Insert row after', expected: { rows: 3, columns: 2 } },
  { label: 'Insert row before', expected: { rows: 3, columns: 2 } },
  { label: 'Delete row', expected: { rows: 1, columns: 2 } },
  { label: 'Insert column after', expected: { rows: 2, columns: 3 } },
  { label: 'Insert column before', expected: { rows: 2, columns: 3 } },
  { label: 'Delete column', expected: { rows: 2, columns: 1 } },
];

for (const { label, expected } of tableActions) {
  test(`Table toolbar: ${label}`, async ({ page }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, ['table']);
    await openInEditor(page, pageId);
    const editorHandle = await getEditorHandle(page);

    await editable(page).getByText('Cell one', { exact: true }).click();
    await page.getByLabel(label, { exact: true }).click();

    await expect
      .poll(async () => tableShape(await getBlock(page, editorHandle, 1)))
      .toEqual(expected);
  });
}

test('Table toolbar deletes the table', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['table']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  await editable(page).getByText('Cell one', { exact: true }).click();
  await page.getByLabel('Delete table', { exact: true }).click();

  await expect
    .poll(async () =>
      (await getValue(page, editorHandle)).some((n) => n.type === 'table'),
    )
    .toBe(false);
});

test('Code block language can be changed', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['codeBlock']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  await editable(page).getByText('function greet(name) {').click();
  await page.getByRole('combobox', { name: 'Code block language' }).click();
  await page.getByPlaceholder('Search language...').fill('Python');
  await page.getByRole('option', { name: 'Python', exact: true }).click();

  await expect
    .poll(async () => (await getBlock(page, editorHandle, 1))?.lang)
    .toBe('python');
});

test('Table of contents lists the headings and jumps to them', async ({
  page,
}) => {
  await login(page);
  const filler = Array.from({ length: 40 }, (_, i) => ({
    type: 'p',
    children: [{ text: `Filler paragraph ${i + 1}` }],
  }));
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [
      { type: 'toc', children: [{ text: '' }] },
      ...filler,
      { type: 'h2', children: [{ text: 'Far away section' }] },
    ],
  });
  await openInEditor(page, pageId);

  const heading = editable(page).locator('h2', { hasText: 'Far away section' });
  await expect(heading).not.toBeInViewport();

  await page.getByRole('button', { name: 'Far away section' }).click();

  await expect(heading).toBeInViewport();
});

test('Typing "@" inserts a mention', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  await focusBlockStart(page, editorHandle, 1);
  await page.keyboard.type('@Aayla');
  await page.getByRole('option', { name: 'Aayla Secura' }).click();

  await expect
    .poll(async () =>
      (await getBlock(page, editorHandle, 1))?.children?.find(
        (child) => child.type === 'mention',
      ),
    )
    .toMatchObject({ type: 'mention', value: 'Aayla Secura' });
});
