import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import { getValue, nodeText, type EditorHandle } from '../fixtures/editor';
import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';

// In Aurora, the settings of the accordion, its panels and the blocks inside
// them show in the sidebar.

const firstPanel = async (page: Page, editorHandle: EditorHandle) =>
  (await getValue(page, editorHandle)).find((node) => node.type === 'accordion')
    ?.children?.[0];

async function openAccordionPage(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  return editorHandle;
}

test('shows the panel and accordion settings in the sidebar', async ({
  page,
}) => {
  const editorHandle = await openAccordionPage(page);
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });

  // The caret in a panel's title shows the panel's settings.
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 0, 0],
    offset: 0,
  });
  await expect(sidebar.getByRole('heading', { name: 'Panel' })).toBeVisible();
  await sidebar.getByRole('textbox', { name: 'Title' }).fill('Hours');
  await expect
    .poll(async () =>
      nodeText((await firstPanel(page, editorHandle))?.children?.[0]),
    )
    .toBe('Hours');

  // The accordion's label shows its settings in the sidebar, not a popover.
  await page.getByRole('button', { name: 'Accordion settings' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    sidebar.getByRole('heading', { name: 'Accordion' }),
  ).toBeVisible();
  await expect(
    sidebar.getByRole('checkbox', { name: 'Only one panel open at a time' }),
  ).toBeVisible();
});

test('adapts the settings of an image in a panel', async ({ page }) => {
  const editorHandle = await openAccordionPage(page);
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 0, 0],
    offset: 0,
  });
  await page.getByRole('button', { name: 'Block actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Turn into…' }).click();
  await page.getByRole('menuitem', { name: 'Image' }).click();

  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
  // The image's settings, under the levels above it. The image has no file
  // yet, so its form only offers to choose one.
  await expect(
    sidebar
      .getByRole('navigation', { name: 'Selection' })
      .getByText('Image', { exact: true }),
  ).toBeVisible();
  // Inside an accordion, an image uses the panel's full width.
  await expect(sidebar.getByText('Image size', { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText('Alignment', { exact: true })).toHaveCount(0);
  await expect(
    sidebar.getByText(/images always use the panel's full width/),
  ).toBeVisible();
  await expect(
    sidebar.getByText('Block 1 of 2 in “Opening hours”'),
  ).toBeVisible();

  // The breadcrumb selects the accordion, whose settings replace the image's.
  await sidebar
    .getByRole('navigation', { name: 'Selection' })
    .getByRole('button', { name: 'Accordion' })
    .click();
  await expect(
    sidebar.getByRole('heading', { name: 'Accordion' }),
  ).toBeVisible();
  await expect(
    sidebar.getByText('Block 1 of 2 in “Opening hours”'),
  ).toHaveCount(0);
});

test('takes Tab from the accordion through the sidebar to the text after it', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['accordion'], {
    extra: [{ type: 'p', children: [{ text: 'After the accordion' }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 0, 0],
    offset: 0,
  });
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
  await expect(sidebar.getByRole('heading', { name: 'Panel' })).toBeVisible();

  // From the accordion's last control, Tab goes to the panel's settings.
  await page.getByRole('button', { name: 'Add a panel at the end' }).focus();
  await page.keyboard.press('Tab');
  await expect(sidebar.locator(':focus')).toHaveCount(1);

  // Through them, and then to the text after the accordion.
  const inSidebar = () =>
    page.evaluate(() => !!document.activeElement?.closest('#sidebar'));
  for (let presses = 0; presses < 30 && (await inSidebar()); presses++) {
    await page.keyboard.press('Tab');
  }
  await page.keyboard.type('Text ');

  await expect
    .poll(async () => nodeText((await getValue(page, editorHandle))[2]))
    .toBe('Text After the accordion');
});

test('climbs the levels with Esc, from a block to the page', async ({
  page,
}) => {
  const editorHandle = await openAccordionPage(page);
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 0, 0],
    offset: 0,
  });
  // A text block shows its place and its actions.
  await expect(
    sidebar.getByText('Block 1 of 2 in “Opening hours”'),
  ).toBeVisible();
  await expect(
    sidebar.getByRole('button', { name: 'Move down' }),
  ).toBeVisible();

  // The block, not the whole accordion.
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-slot="block-selection"]')).toHaveCount(1);
  await expect(
    page.locator('.block-accordion__content [data-slot="block-selection"]'),
  ).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(sidebar.getByRole('heading', { name: 'Panel' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    sidebar.getByRole('heading', { name: 'Accordion' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    sidebar.getByText(/Click the accordion's frame or its label/),
  ).toBeVisible();
});

test('deletes a selected block with Delete, with Undo', async ({ page }) => {
  const editorHandle = await openAccordionPage(page);
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 0, 0],
    offset: 0,
  });

  await page.keyboard.press('Escape');
  await page.keyboard.press('Delete');

  await expect
    .poll(
      async () =>
        ((await firstPanel(page, editorHandle))?.children?.[1]?.children ?? [])
          .length,
    )
    .toBe(1);
  await expect(
    page.locator('[data-sonner-toast]').getByText('Text block deleted'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect
    .poll(async () =>
      nodeText((await firstPanel(page, editorHandle))?.children?.[1]),
    )
    .toContain('Monday to Friday');
});
