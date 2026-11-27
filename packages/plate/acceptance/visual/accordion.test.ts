import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { settle } from './helpers';

// The accordion in the editor: the frame with its controls, the block
// toolbar and its menu, and the settings in the sidebar. Its published view
// is part of the native blocks page.

async function openAccordion(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  // The caret in the first block of the first panel.
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 0, 0],
    offset: 0,
  });
  const accordion = page.locator('.slate-accordion');
  await expect(page.getByRole('button', { name: 'Expand all' })).toBeVisible();
  return accordion;
}

test('Accordion selected in the editor', async ({ page }) => {
  const accordion = await openAccordion(page);
  await settle(page);

  await expect(accordion).toHaveScreenshot('accordion-editor-selected.png');
});

test('Accordion block actions menu', async ({ page }) => {
  await openAccordion(page);
  await page.getByRole('button', { name: 'Block actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Turn into…' }).click();
  const menu = page.getByRole('menu').last();
  await expect(menu).toBeVisible();
  await settle(page);

  await expect(menu).toHaveScreenshot('accordion-block-actions-menu.png');
});

test('Accordion settings in the sidebar', async ({ page }) => {
  await openAccordion(page);
  await page.getByRole('button', { name: 'Accordion settings' }).click();
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
  await expect(
    sidebar.getByRole('heading', { name: 'Accordion' }),
  ).toBeVisible();
  await settle(page);

  await expect(sidebar).toHaveScreenshot('accordion-settings-sidebar.png');
});
