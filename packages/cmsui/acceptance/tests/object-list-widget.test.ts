import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { openObjectListBlock, saveAndReadBlock } from '../fixtures/object-list';

// The `object_list` widget in the settings of a block, from
// `@plone/test-addon`. The sidebar is narrow, so the table field shows its
// items as rows, and edits them in a dialog.

const siteActions = (page: Page) =>
  page.locator('#sidebar').getByRole('group', { name: 'Site actions' });
const socialLinks = (page: Page) =>
  page.locator('#sidebar').getByRole('group', { name: 'Social links' });

const ids = (items: unknown) =>
  (items as Array<{ '@id': string }>).map((item) => item['@id']);

test.describe('The object list widget, accordion layout', () => {
  test('edits an item in place, and saves it with the block', async ({
    page,
  }) => {
    await openObjectListBlock(page);
    const list = siteActions(page);

    await list.getByRole('button', { name: /^Accessibility/ }).click();
    const title = list.getByRole('textbox', { name: 'Title' });
    await expect(title).toHaveValue('Accessibility');
    await title.fill('Accessibility statement');
    // The row's title follows the field.
    await expect(
      list.getByRole('button', { name: /^Accessibility statement/ }),
    ).toBeVisible();

    // The backend serializes the paths in block data as URLs, so only the ids
    // and the titles are compared.
    const block = await saveAndReadBlock(page);
    expect(
      (block.actions as Array<Record<string, unknown>>).map(
        ({ '@id': id, title }) => ({ id, title }),
      ),
    ).toEqual([
      { id: 'a1', title: 'Sitemap' },
      { id: 'a2', title: 'Accessibility statement' },
      { id: 'a3', title: 'Contact' },
    ]);
  });

  test('adds an item with the defaults of its schema, and opens it', async ({
    page,
  }) => {
    await openObjectListBlock(page);
    const list = siteActions(page);

    await list.getByRole('button', { name: 'Add Action' }).click();
    // The new item is open, and named by its position until it has a title.
    await expect(list.getByRole('button', { name: /^Action 4/ })).toBeVisible();
    await list.getByRole('textbox', { name: 'Title' }).fill('Imprint');

    const block = await saveAndReadBlock(page);
    const added = (block.actions as Array<Record<string, unknown>>)[3];
    expect(added).toMatchObject({ title: 'Imprint', newTab: false });
    expect(added['@id']).toEqual(expect.any(String));
  });

  test('reorders the items by dragging with the keyboard', async ({ page }) => {
    await openObjectListBlock(page);
    const list = siteActions(page);

    // React Aria's keyboard drag and drop. The list is one tab stop, and the
    // arrows move between its rows. Tab reaches the row's drag handle, Enter
    // picks the item up, the arrows move the drop target, and Enter drops it.
    await list.getByRole('row', { name: /Sitemap/ }).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(
      list.getByRole('button', { name: /^Drag Contact/ }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    for (const target of [
      'Insert between Accessibility and Contact',
      'Insert between Sitemap and Accessibility',
      'Insert before Sitemap',
    ]) {
      await page.keyboard.press('ArrowUp');
      await expect(list.getByRole('button', { name: target })).toBeFocused();
    }
    await page.keyboard.press('Enter');

    await expect(list.getByRole('row').first()).toContainText('Contact');
    const block = await saveAndReadBlock(page);
    expect(ids(block.actions)).toEqual(['a3', 'a1', 'a2']);
  });

  test('moves an item with its menu', async ({ page }) => {
    await openObjectListBlock(page);
    const list = siteActions(page);

    await list.getByRole('button', { name: 'Actions for Sitemap' }).click();
    await page.getByRole('menuitem', { name: 'Move down' }).click();

    await expect(list.getByRole('row').first()).toContainText('Accessibility');
    const block = await saveAndReadBlock(page);
    expect(ids(block.actions)).toEqual(['a2', 'a1', 'a3']);
  });

  test('duplicates an item with an @id of its own', async ({ page }) => {
    await openObjectListBlock(page);
    const list = siteActions(page);

    await list.getByRole('button', { name: 'Actions for Contact' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(list.getByRole('row')).toHaveCount(4);

    const block = await saveAndReadBlock(page);
    const [, , original, copy] = block.actions as Array<
      Record<string, unknown>
    >;
    expect(copy.title).toBe('Contact');
    expect(copy['@id']).not.toBe(original['@id']);
  });

  test('asks before removing an item', async ({ page }) => {
    await openObjectListBlock(page);
    const list = siteActions(page);

    await list.getByRole('button', { name: 'Actions for Sitemap' }).click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    const dialog = page.getByRole('dialog', { name: 'Remove Sitemap?' });
    await expect(dialog).toBeVisible();

    // Cancel keeps the item.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(list.getByRole('row')).toHaveCount(3);

    await list.getByRole('button', { name: 'Actions for Sitemap' }).click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    await page
      .getByRole('dialog', { name: 'Remove Sitemap?' })
      .getByRole('button', { name: 'Remove' })
      .click();
    await expect(list.getByRole('row')).toHaveCount(2);

    const block = await saveAndReadBlock(page);
    expect(ids(block.actions)).toEqual(['a2', 'a3']);
  });

  test('shows the errors of an item field, and marks its row', async ({
    page,
  }) => {
    await openObjectListBlock(page);
    const list = siteActions(page);

    await list.getByRole('button', { name: /^Contact/ }).click();
    const title = list.getByRole('textbox', { name: /^Title/ });
    await title.fill('');
    await title.blur();

    await expect(list.getByText('Required input is missing.')).toBeVisible();
    await expect(title).toHaveAttribute('aria-invalid', 'true');
    await expect(
      list.getByText('Some fields of this item need attention.'),
    ).toBeVisible();

    // Filling it in clears both.
    await title.fill('Get in touch');
    await expect(list.getByText('Required input is missing.')).toHaveCount(0);
    await expect(
      list.getByText('Some fields of this item need attention.'),
    ).toHaveCount(0);
  });

  test('shows an empty state that adds the first item', async ({ page }) => {
    await openObjectListBlock(page, { actions: [], links: [] });
    const list = siteActions(page);

    await expect(list.getByText('Nothing added yet.')).toBeVisible();
    await list.getByRole('button', { name: 'Add Action' }).click();
    await list.getByRole('textbox', { name: 'Title' }).fill('Sitemap');

    const block = await saveAndReadBlock(page);
    expect(block.actions).toEqual([
      expect.objectContaining({ title: 'Sitemap', newTab: false }),
    ]);
  });
});

test.describe('The object list widget, table layout', () => {
  test('edits an item in a dialog, and saves it on Save', async ({ page }) => {
    await openObjectListBlock(page);
    const list = socialLinks(page);

    await list.getByRole('button', { name: 'Edit Plone on Mastodon' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Link' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Title' }).fill('Mastodon');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(list.getByText('Mastodon', { exact: true })).toBeVisible();

    const block = await saveAndReadBlock(page);
    expect(block.links).toEqual([
      expect.objectContaining({ '@id': 'l1', title: 'Mastodon' }),
      expect.objectContaining({ '@id': 'l2', title: 'GitHub' }),
    ]);
  });

  test('validates a new item before adding it', async ({ page }) => {
    await openObjectListBlock(page);
    const list = socialLinks(page);

    await list.getByRole('button', { name: 'Add Link' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add Link' });
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();

    // The network and the link are required.
    await expect(dialog.getByText('Required input is missing.')).toHaveCount(2);
    await expect(dialog).toBeVisible();
  });

  test('cancels the dialog without changing the list', async ({ page }) => {
    await openObjectListBlock(page);
    const list = socialLinks(page);

    await list.getByRole('button', { name: 'Edit GitHub' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Link' });
    await dialog.getByRole('textbox', { name: 'Title' }).fill('Changed');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);

    await expect(list.getByText('Changed')).toHaveCount(0);
    await expect(list.getByText('GitHub', { exact: true })).toBeVisible();
  });
});
