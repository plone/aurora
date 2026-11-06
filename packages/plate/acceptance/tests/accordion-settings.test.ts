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
// label and the panels' Settings buttons.

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
  const dialog = page.getByRole('dialog', { name: 'Accordion settings' });
  await expect(dialog.getByText('2 panels')).toBeVisible();

  await dialog
    .getByRole('checkbox', { name: 'Only one panel open at a time' })
    .uncheck();
  // The fixture's accordion is grey.
  await dialog.getByText('White', { exact: true }).click();

  // Reorders the panels from the outline with the keyboard.
  await dialog
    .getByRole('row', { name: '1. Opening hours' })
    .getByRole('button', { name: 'Drag to reorder' })
    .focus();
  // Enter starts dragging, on the drop position between the two panels;
  // ArrowDown moves to the position after the last panel.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect
    .poll(async () =>
      ((await accordionOf(page, editorHandle))?.children ?? []).map((panel) =>
        nodeText(panel.children?.[0]),
      ),
    )
    .toEqual(['How to find us', 'Opening hours']);

  await page.keyboard.press('Escape');
  await savePage(page);
  const stored = (await getStoredValue(page, pageId)).find(
    (node) => node.type === 'accordion',
  );
  expect(stored).toMatchObject({ exclusive: false, theme: 'white' });
});

test('edits the panel settings', async ({ page }) => {
  const { pageId } = await openAccordionPage(page);

  await page.getByRole('button', { name: 'Panel settings' }).nth(1).click();
  const dialog = page.getByRole('dialog', { name: 'Panel settings' });
  await expect(dialog.getByText('Panel 2 of 2 · 1 block')).toBeVisible();

  await dialog.getByRole('textbox', { name: 'Title' }).fill('Directions');
  await dialog
    .getByRole('checkbox', { name: 'Open when the page loads' })
    .check();
  const anchor = dialog.getByRole('textbox', { name: 'Link anchor' });
  await anchor.fill('Opening Hours');
  await anchor.blur();
  // The first panel already uses this anchor.
  await expect(dialog.getByRole('alert')).toBeVisible();
  await anchor.fill('directions');
  await anchor.blur();
  await expect(dialog.getByRole('alert')).toHaveCount(0);

  await page.keyboard.press('Escape');
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
