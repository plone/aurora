import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorText } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { focusBlockStart } from '../fixtures/editor';
import type { NativeBlockSection } from '../fixtures/native-blocks';
import { settle } from './helpers';

const TEXT = 'Overlay paragraph';

// Editor overlays (menus, toolbars, popovers) are the most Tailwind-heavy UI
// and the easiest to break silently: each one is captured on its own element.

async function openEditor(
  page: Page,
  sections: NativeBlockSection[] = [],
  extra: Record<string, unknown>[] = [
    { type: 'p', children: [{ text: TEXT }] },
  ],
) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, sections, { extra });
  await openInEditor(page, pageId);
  return getEditorHandle(page);
}

async function selectParagraph(page: Page, index = 1) {
  const editorHandle = await getEditorHandle(page);
  await selectPlateEditorText(
    page,
    editorHandle,
    {
      anchor: { path: [index, 0], offset: 0 },
      focus: { path: [index, 0], offset: TEXT.length },
    },
    TEXT,
  );
  const toolbar = page.getByLabel('Editor toolbar');
  await expect(toolbar).toBeVisible();
  return toolbar;
}

test('Floating toolbar', async ({ page }) => {
  await openEditor(page);
  const toolbar = await selectParagraph(page);
  await settle(page);

  await expect(toolbar).toHaveScreenshot('floating-toolbar.png');
});

test('Turn into menu', async ({ page }) => {
  await openEditor(page);
  const toolbar = await selectParagraph(page);
  await toolbar.getByLabel('Turn into').click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await settle(page);

  await expect(menu).toHaveScreenshot('turn-into-menu.png');
});

test('Slash menu', async ({ page }) => {
  const editorHandle = await openEditor(
    page,
    [],
    [{ type: 'p', children: [{ text: '' }] }],
  );
  await focusBlockStart(page, editorHandle, 1);
  await page.keyboard.type('/');
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await settle(page);

  await expect(listbox).toHaveScreenshot('slash-menu.png');
});

test('Block context menu', async ({ page }) => {
  await openEditor(page);
  await page
    .locator('[data-slate-editor]')
    .getByText(TEXT, { exact: true })
    .click({ button: 'right' });
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await settle(page);

  await expect(menu).toHaveScreenshot('block-context-menu.png');
});

test('Link insert popover', async ({ page }) => {
  await openEditor(page);
  const toolbar = await selectParagraph(page);
  await toolbar.getByLabel('Link').click();
  const input = page
    .getByPlaceholder('Paste link or search content')
    .filter({ visible: true });
  await expect(input).toBeVisible();
  await settle(page);

  // The popover is the input's closest floating container.
  await expect(
    input.locator('xpath=ancestor::*[contains(@class,"z-50")][1]'),
  ).toHaveScreenshot('link-popover.png');
});

test('Table toolbar', async ({ page }) => {
  await openEditor(page, ['table'], []);
  await page
    .locator('[data-slate-editor]')
    .getByText('Cell one', { exact: true })
    .click();
  const deleteTable = page.getByLabel('Delete table', { exact: true });
  await expect(deleteTable).toBeVisible();
  await settle(page);

  await expect(
    deleteTable.locator('xpath=ancestor::*[@data-slot="popover-content"][1]'),
  ).toHaveScreenshot('table-toolbar.png');
});

test('Mention combobox', async ({ page }) => {
  const editorHandle = await openEditor(
    page,
    [],
    [{ type: 'p', children: [{ text: '' }] }],
  );
  await focusBlockStart(page, editorHandle, 1);
  await page.keyboard.type('@Admiral');
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await settle(page);

  await expect(listbox).toHaveScreenshot('mention-combobox.png');
});

test('Code block language picker', async ({ page }) => {
  await openEditor(page, ['codeBlock'], []);
  await page
    .locator('[data-slate-editor]')
    .getByText('function greet(name) {')
    .click();
  await page.getByRole('combobox', { name: 'Code block language' }).click();
  const picker = page.getByPlaceholder('Search language...');
  await expect(picker).toBeVisible();
  await settle(page);

  await expect(
    picker.locator('xpath=ancestor::*[@data-slot="popover-content"][1]'),
  ).toHaveScreenshot('code-language-picker.png');
});
