import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

// The Contents view actions call the `@contents/<action>` resource routes.

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
