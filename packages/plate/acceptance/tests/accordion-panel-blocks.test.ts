import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import { getValue, nodeText, type EditorHandle } from '../fixtures/editor';
import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';

// Editing the blocks of an accordion panel: inserting them, the block
// toolbar, "Turn into", and the blocks a panel can hold.

const firstPanelBlocks = async (page: Page, editorHandle: EditorHandle) => {
  const accordion = (await getValue(page, editorHandle)).find(
    (node) => node.type === 'accordion',
  );
  return accordion?.children?.[0]?.children?.[1]?.children ?? [];
};

const blockKinds = async (page: Page, editorHandle: EditorHandle) =>
  (await firstPanelBlocks(page, editorHandle)).map((block) =>
    block.type === 'ploneBlock' ? String(block['@type']) : String(block.type),
  );

async function openAccordionPage(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  // The first block of the first panel: "Monday to Friday…".
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 0, 0],
    offset: 0,
  });
  return editorHandle;
}

test('inserts a block from an insert point', async ({ page }) => {
  const editorHandle = await openAccordionPage(page);

  await page
    .getByRole('button', {
      name: 'Insert a block at the top of “Opening hours”',
    })
    .click();
  await page.getByRole('option', { name: 'Image', exact: true }).click();

  await expect
    .poll(() => blockKinds(page, editorHandle))
    .toEqual(['image', 'p', 'p']);
});

test('only offers the blocks a panel can hold', async ({ page }) => {
  const editorHandle = await openAccordionPage(page);
  // The empty paragraph at the end of the first panel.
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 1, 0],
    offset: 0,
  });
  await page.keyboard.type('/');

  await expect(
    page.getByRole('option', { name: 'Text', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: 'Table', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: 'Image', exact: true }),
  ).toBeVisible();
  for (const name of ['Heading 2', 'Blockquote', 'Callout', 'Accordion']) {
    await expect(page.getByRole('option', { name, exact: true })).toHaveCount(
      0,
    );
  }
  await expect(
    page.getByText("Accordions can't be placed inside an accordion."),
  ).toBeVisible();
});

test('moves, turns into and deletes blocks from their toolbar', async ({
  page,
}) => {
  const editorHandle = await openAccordionPage(page);

  await page.getByRole('button', { name: 'Move block down' }).first().click();
  await expect
    .poll(async () =>
      (await firstPanelBlocks(page, editorHandle)).map(nodeText),
    )
    .toEqual(['', 'Monday to Friday, 9:00 to 17:00.']);

  await page.getByRole('button', { name: 'Block actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Turn into…' }).click();
  await page.getByRole('menuitem', { name: 'Image' }).click();
  await expect
    .poll(() => blockKinds(page, editorHandle))
    .toEqual(['image', 'p']);

  await page.getByRole('button', { name: 'Block actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect.poll(() => blockKinds(page, editorHandle)).toEqual(['p']);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect
    .poll(() => blockKinds(page, editorHandle))
    .toEqual(['image', 'p']);
});

test('Enter on a Plone block in a panel adds a paragraph in the panel', async ({
  page,
}) => {
  const editorHandle = await openAccordionPage(page);
  // Turns the last block of the first panel into an image.
  await page.getByRole('button', { name: 'Block actions' }).nth(1).click();
  await page.getByRole('menuitem', { name: 'Turn into…' }).click();
  await page.getByRole('menuitem', { name: 'Image' }).click();
  await expect
    .poll(() => blockKinds(page, editorHandle))
    .toEqual(['p', 'image']);

  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 1, 0],
    offset: 0,
  });
  await page.keyboard.press('Enter');
  await page.keyboard.type('After the image');

  await expect
    .poll(async () =>
      (await firstPanelBlocks(page, editorHandle)).map(nodeText),
    )
    .toEqual(['Monday to Friday, 9:00 to 17:00.', '', 'After the image']);
});
