import type { Page } from '@playwright/test';

import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorPoint } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import {
  getValue,
  insertWithSlashMenu,
  nodeText,
  type EditorHandle,
} from '../fixtures/editor';
import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  savePage,
} from '../fixtures/pages';

// Editing the accordion block: inserting it, writing panel titles and
// content, and opening, closing and adding panels while editing.

const accordionOf = async (page: Page, editorHandle: EditorHandle) =>
  (await getValue(page, editorHandle)).find(
    (node) => node.type === 'accordion',
  );

async function openAccordionPage(page: Page) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['accordion']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  // The accordion follows the title block, at index 1.
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 0, 0],
    offset: 0,
  });
  return { pageId, editorHandle };
}

test('inserts an accordion and writes its first panel', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  await insertWithSlashMenu(page, editorHandle, 1, 'Accordion');

  // The caret is in the title of the first panel; Enter moves into the panel.
  await page.keyboard.type('Opening hours');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Monday to Friday.');

  await expect
    .poll(async () => {
      const accordion = await accordionOf(page, editorHandle);
      const panel = accordion?.children?.[0];
      return [nodeText(panel?.children?.[0]), nodeText(panel?.children?.[1])];
    })
    .toEqual(['Opening hours', 'Monday to Friday.']);

  await savePage(page);
  const stored = await getStoredValue(page, pageId);
  const accordion = stored.find((node) => node.type === 'accordion') as any;
  expect(accordion).toMatchObject({
    exclusive: true,
    theme: 'white',
    children: [
      {
        type: 'accordion_panel',
        startOpen: false,
        anchor: '',
        children: [
          { type: 'accordion_panel_title' },
          { type: 'accordion_panel_content' },
        ],
      },
    ],
  });
});

test('opens and closes panels while editing', async ({ page }) => {
  await openAccordionPage(page);

  const collapse = page.getByRole('button', {
    name: 'Collapse How to find us',
  });
  await collapse.click();
  const expand = page.getByRole('button', { name: 'Expand How to find us' });
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('Take the tram to Central Square.')).toBeHidden();
  await expect(page.getByText('1 block', { exact: true })).toBeVisible();

  // Panels open and close independently while editing.
  await expect(
    page.getByRole('button', { name: 'Collapse Opening hours' }),
  ).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('button', { name: 'Collapse all' }).click();
  await expect(
    page.getByRole('button', { name: 'Expand Opening hours' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Expand all' }).click();
  await expect(
    page.getByRole('button', { name: 'Collapse Opening hours' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Collapse How to find us' }),
  ).toBeVisible();
});

test('adds and inserts panels', async ({ page }) => {
  const { editorHandle } = await openAccordionPage(page);

  await page.getByRole('button', { name: 'Add a panel at the end' }).click();
  await page.keyboard.type('Contact');
  await page
    .getByRole('button', { name: 'Insert a panel between panel 1 and 2' })
    .click();
  await page.keyboard.type('Prices');

  await expect
    .poll(async () =>
      ((await accordionOf(page, editorHandle))?.children ?? []).map((panel) =>
        nodeText(panel.children?.[0]),
      ),
    )
    .toEqual(['Opening hours', 'Prices', 'How to find us', 'Contact']);
});

test('does not offer an accordion inside an accordion', async ({ page }) => {
  const { editorHandle } = await openAccordionPage(page);
  // The empty paragraph at the end of the first panel.
  await selectPlateEditorPoint(page, editorHandle, {
    path: [1, 0, 1, 1, 0],
    offset: 0,
  });
  await page.keyboard.type('/');

  await expect(
    page.getByRole('option', { name: 'Heading 2', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: 'Accordion', exact: true }),
  ).toHaveCount(0);
});
