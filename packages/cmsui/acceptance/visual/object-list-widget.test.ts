import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { settle } from '../../../tooling/playwright/visual';
import { openObjectListBlock } from '../fixtures/object-list';

// The `object_list` widget in the block settings sidebar, from the
// `objectListTest` block of `@plone/test-addon`. Each screenshot is of the
// field, or of the dialog, so changes around them don't affect it.

// A taller window, so the sidebar shows both fields without scrolling.
test.use({ viewport: { width: 1280, height: 1100 } });

const siteActions = (page: Page) =>
  page.locator('#sidebar').getByRole('group', { name: 'Site actions' });
const socialLinks = (page: Page) =>
  page.locator('#sidebar').getByRole('group', { name: 'Social links' });

async function shot(page: Page) {
  // No hover or focus ring from the last click.
  await page.mouse.move(0, 0);
  await settle(page);
}

test('Accordion with its items closed', async ({ page }) => {
  await openObjectListBlock(page);
  await shot(page);

  await expect(siteActions(page)).toHaveScreenshot('object-list-accordion.png');
});

test('Accordion with an item open', async ({ page }) => {
  await openObjectListBlock(page);
  await siteActions(page)
    .getByRole('button', { name: /^Accessibility/ })
    .click();
  await expect(
    siteActions(page).getByRole('textbox', { name: 'Title' }),
  ).toBeVisible();
  await shot(page);

  await expect(siteActions(page)).toHaveScreenshot(
    'object-list-accordion-open.png',
  );
});

test('Accordion with an item with errors', async ({ page }) => {
  await openObjectListBlock(page);
  const list = siteActions(page);
  await list.getByRole('button', { name: /^Contact/ }).click();
  const title = list.getByRole('textbox', { name: /^Title/ });
  await title.fill('');
  await title.blur();
  await expect(list.getByText('Required input is missing.')).toBeVisible();
  await shot(page);

  await expect(list).toHaveScreenshot('object-list-accordion-invalid.png');
});

test('Accordion with no items', async ({ page }) => {
  await openObjectListBlock(page, { actions: [], links: [] });
  await expect(siteActions(page).getByText('Nothing added yet.')).toBeVisible();
  await shot(page);

  await expect(siteActions(page)).toHaveScreenshot(
    'object-list-accordion-empty.png',
  );
});

test('Table as rows, in the sidebar', async ({ page }) => {
  await openObjectListBlock(page);
  await shot(page);

  await expect(socialLinks(page)).toHaveScreenshot(
    'object-list-table-rows.png',
  );
});

test('Item menu', async ({ page }) => {
  await openObjectListBlock(page);
  await siteActions(page)
    .getByRole('button', { name: 'Actions for Accessibility' })
    .click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await settle(page);

  await expect(menu).toHaveScreenshot('object-list-item-menu.png');
});

test('Edit dialog of a table item, with errors', async ({ page }) => {
  await openObjectListBlock(page);
  await socialLinks(page).getByRole('button', { name: 'Add Link' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Link' });
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dialog.getByText('Required input is missing.')).toHaveCount(2);
  await shot(page);

  await expect(dialog).toHaveScreenshot('object-list-item-dialog.png');
});

test('Remove confirmation', async ({ page }) => {
  await openObjectListBlock(page);
  await siteActions(page)
    .getByRole('button', { name: 'Actions for Sitemap' })
    .click();
  await page.getByRole('menuitem', { name: 'Remove' }).click();
  const dialog = page.getByRole('dialog', { name: 'Remove Sitemap?' });
  await expect(dialog).toBeVisible();
  await shot(page);

  await expect(dialog).toHaveScreenshot('object-list-remove-dialog.png');
});
