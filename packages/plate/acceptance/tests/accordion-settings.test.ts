import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import { getValue, nodeText, type EditorHandle } from '../fixtures/editor';
import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  savePage,
} from '../fixtures/pages';

// The settings of the accordion and its panels, opened from the accordion's
// label and the panels' Settings buttons. In Aurora they show in the sidebar.

const accordionOf = async (page: Page, editorHandle: EditorHandle) =>
  (await getValue(page, editorHandle)).find(
    (node) => node.type === 'accordion',
  );

async function openAccordionPage(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 0, 0],
    offset: 0,
  });
  return { pageId, editorHandle };
}

test('edits the accordion settings', async ({ page }) => {
  const { pageId, editorHandle } = await openAccordionPage(page);

  await page.getByRole('button', { name: 'Accordion settings' }).click();
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
  await expect(sidebar.getByText('2 panels')).toBeVisible();

  // Reorders the panels from the outline with the keyboard: Enter on a drag
  // handle starts dragging, on the drop position between the two panels;
  // ArrowDown moves to the position after the last panel.
  await sidebar
    .getByRole('row', { name: '1. Opening hours' })
    .getByRole('button', { name: 'Drag to reorder' })
    .press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect
    .poll(async () =>
      ((await accordionOf(page, editorHandle))?.children ?? []).map((panel) =>
        nodeText(panel.children?.[0]),
      ),
    )
    .toEqual(['How to find us', 'Opening hours']);

  await sidebar
    .getByRole('checkbox', { name: 'Only one panel open at a time' })
    .uncheck();
  // The fixture's accordion is grey.
  await sidebar.getByText('White', { exact: true }).click();

  await savePage(page);
  const stored = (await getStoredValue(page, pageId)).find(
    (node) => node.type === 'accordion',
  );
  expect(stored).toMatchObject({ exclusive: false, theme: 'white' });
});

test('edits the panel settings', async ({ page }) => {
  const { pageId } = await openAccordionPage(page);

  await page.getByRole('button', { name: 'Panel settings' }).nth(1).click();
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
  await expect(sidebar.getByText('Panel 2 of 2 · 1 block')).toBeVisible();

  await sidebar.getByRole('textbox', { name: 'Title' }).fill('Directions');
  await sidebar
    .getByRole('checkbox', { name: 'Open when the page loads' })
    .check();
  const anchor = sidebar.getByRole('textbox', { name: 'Link anchor' });
  await anchor.fill('Opening Hours');
  await anchor.blur();
  // The first panel already uses this anchor.
  await expect(sidebar.getByRole('alert')).toBeVisible();
  await anchor.fill('directions');
  await anchor.blur();
  await expect(sidebar.getByRole('alert')).toHaveCount(0);

  await savePage(page);
  const stored = (await getStoredValue(page, pageId)).find(
    (node) => node.type === 'accordion',
  ) as any;
  expect(stored.children[1]).toMatchObject({
    startOpen: true,
    anchor: 'directions',
    children: [{ children: [{ text: 'Directions' }] }, {}],
  });
});
