import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import { settle } from '../../../tooling/playwright/visual';
import { createPloneBlocksPage, routeEmbeds } from '../fixtures/plone-blocks';

// One page with each Plone block that renders content, in the public view and
// in the editor. The image block's alignments have their own screenshots.

test('Plone blocks in the public view', async ({ page }) => {
  await routeEmbeds(page);
  const pageId = await createPloneBlocksPage(page);
  await page.goto(`/${pageId}`);
  await expect(page.locator('[data-slate-editor] iframe')).toHaveCount(2);
  await settle(page);

  await expect(page.locator('[data-slate-editor]')).toHaveScreenshot(
    'plone-blocks-view.png',
  );
});

test('Plone blocks in the editor', async ({ page }) => {
  await routeEmbeds(page);
  const pageId = await createPloneBlocksPage(page);
  await login(page);
  await page.goto(`/@@edit/${pageId}`);
  await waitForPlateEditorReady(page);
  await expect(page.locator('[data-slate-editor] iframe')).toHaveCount(2);
  await page.mouse.move(0, 0);
  await settle(page);

  await expect(page.locator('[data-slate-editor]')).toHaveScreenshot(
    'plone-blocks-edit.png',
  );
});
