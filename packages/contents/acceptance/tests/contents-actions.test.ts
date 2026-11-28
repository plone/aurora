import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

// The Contents view actions call the `@@contents/@<action>` resource routes.

async function setupFolder(page: Page, titles: string[]) {
  const folderId = `contents-actions-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  // Documents are folderish with plone.volto.
  await createContent(page, {
    contentType: 'Document',
    contentId: folderId,
    contentTitle: 'Contents actions',
  });
  for (const [i, title] of titles.entries()) {
    await createContent(page, {
      contentType: 'Document',
      contentId: `item-${i}`,
      contentTitle: title,
      path: folderId,
    });
  }
  await page.goto(`/@@contents/${folderId}`, { waitUntil: 'networkidle' });
  return folderId;
}

async function selectRow(page: Page, title: string) {
  // React Aria hides the checkbox input under its grid cell.
  await page
    .getByRole('row', { name: title })
    .getByRole('checkbox')
    .check({ force: true });
}

test.describe('Contents view actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('shows every action, disabled until it can be used', async ({
    page,
  }) => {
    await setupFolder(page, ['Pick me']);
    const toolbar = page.getByRole('toolbar', { name: 'Contents actions' });

    await expect(
      toolbar.getByRole('button', { name: 'Upload', exact: true }),
    ).toBeEnabled();
    for (const name of ['Rename', 'Cut', 'Copy', 'Paste', 'Delete']) {
      await expect(
        toolbar.getByRole('button', { name, exact: true }),
      ).toBeDisabled();
    }
    await expect(
      page.getByRole('button', { name: 'More options for Pick me' }),
    ).toBeVisible();

    await selectRow(page, 'Pick me');
    for (const name of ['Rename', 'Cut', 'Copy', 'Delete']) {
      await expect(
        toolbar.getByRole('button', { name, exact: true }),
      ).toBeEnabled();
    }
    await expect(
      toolbar.getByRole('button', { name: 'Paste', exact: true }),
    ).toBeDisabled();

    // The toolbar is one tab stop: the arrow keys move between its actions.
    await toolbar.getByRole('button', { name: 'Upload', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(
      toolbar.getByRole('button', { name: 'Rename', exact: true }),
    ).toBeFocused();
  });

  test('shows where a row dragged with the keyboard will land', async ({
    page,
  }) => {
    await setupFolder(page, ['First', 'Second', 'Third']);

    // Reach the drag handle of the first row like a keyboard user: from the
    // filter into the grid, then to the handle.
    await page.getByRole('searchbox').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByRole('button', { name: 'Drag First' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');

    const indicator = page.locator('tr[data-drop-target]');
    await expect(indicator).toHaveCount(1);
    await expect(indicator).toHaveCSS('outline-style', 'solid');
    await expect(page.locator('tr[data-dragging]')).toContainText('First');

    await page.keyboard.press('Escape');
    await expect(indicator).toHaveCount(0);
  });

  test('tells screen readers the results count and missing states', async ({
    page,
  }) => {
    const folderId = await setupFolder(page, ['A page']);
    // Images have no workflow, so no review state.
    await createContent(page, {
      contentType: 'Image',
      contentId: 'an-image',
      contentTitle: 'An image',
      path: folderId,
      image: true,
    });
    await page.goto(`/@@contents/${folderId}`, { waitUntil: 'networkidle' });

    await expect(page.locator('[aria-live="polite"]')).toHaveText('2 items');
    const imageRow = page.getByRole('row', { name: /An image/ });
    // The dash is hidden from screen readers, which hear a label instead.
    await expect(imageRow.getByText('—')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(imageRow.getByText('No workflow state')).toBeAttached();

    await page.getByRole('searchbox').fill('image');
    await expect(page.locator('[aria-live="polite"]')).toHaveText('1 item');
  });

  test('deletes an item', async ({ page }) => {
    await setupFolder(page, ['Delete me', 'Keep me']);

    await selectRow(page, 'Delete me');
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();

    await expect(page.getByRole('row', { name: 'Delete me' })).toHaveCount(0);
    // The listing drops the row right away; reload to check it was deleted.
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('row', { name: 'Delete me' })).toHaveCount(0);
    await expect(page.getByRole('row', { name: 'Keep me' })).toBeVisible();
  });

  test('renames an item', async ({ page }) => {
    await setupFolder(page, ['Rename me']);

    await selectRow(page, 'Rename me');
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name: Rename me').fill('Renamed item');
    await dialog.getByRole('button', { name: 'Rename', exact: true }).click();

    await expect(page.getByRole('row', { name: 'Renamed item' })).toBeVisible();
  });

  test('loads the transitions of the selected items', async ({ page }) => {
    await setupFolder(page, ['Change my state']);

    await selectRow(page, 'Change my state');
    await page
      .getByRole('button', { name: 'Change state', exact: true })
      .click();

    await expect(
      page.getByRole('dialog').getByText('Select new state…'),
    ).toBeVisible();
  });
});
