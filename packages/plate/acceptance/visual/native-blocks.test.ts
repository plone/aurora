import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

import { ALL_NATIVE_BLOCK_SECTIONS } from '../fixtures/native-blocks';
import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';
import { settle } from './helpers';

// One page with every native block of Aurora's presets, captured once per
// context. Full-page shots keep the image count low while still covering the
// styling of each block, and the diff image shows which block changed.

test('Native blocks in the public view (desktop)', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ALL_NATIVE_BLOCK_SECTIONS);

  await openInView(page, pageId);
  await settle(page);

  await expect(page).toHaveScreenshot('native-blocks-view-desktop.png', {
    fullPage: true,
  });
});

test('Native blocks in the public view (mobile)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await login(page);
  const pageId = await createNativeBlocksPage(page, ALL_NATIVE_BLOCK_SECTIONS);

  await openInView(page, pageId);
  await settle(page);

  await expect(page).toHaveScreenshot('native-blocks-view-mobile.png', {
    fullPage: true,
  });
});

test('Native blocks in the editor', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ALL_NATIVE_BLOCK_SECTIONS);

  await openInEditor(page, pageId);
  // Toggles start collapsed in the editor; open it so its content is shown.
  await page.getByRole('button', { name: 'Toggle content' }).click();
  await page.mouse.move(0, 0);
  await settle(page);

  await expect(page.locator('[data-slate-editor]')).toHaveScreenshot(
    'native-blocks-edit.png',
  );
});
