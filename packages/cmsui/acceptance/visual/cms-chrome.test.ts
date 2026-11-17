import type { Page } from '@playwright/test';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import { settle } from '../../../tooling/playwright/visual';

// The CMS chrome (toolbar, sidebar, forms, control panels) around the editor.
// It's the safety net for changes to the CSS cascade layers and the Tailwind
// reset, which affect every CMS screen at once. Block content is covered by
// the native blocks screenshots in @plone/plate.

const PAGE_ID = 'chrome-page';
const IMAGE_ID = 'chrome-image';

async function createPage(page: Page, value?: Record<string, unknown>[]) {
  await createContent(page, {
    contentType: 'Document',
    contentId: PAGE_ID,
    contentTitle: 'Chrome page',
    transition: 'publish',
    ...(value && {
      bodyModifier: (body) => ({
        ...body,
        blocks: {
          __somersault__: { '@type': '__somersault__', value },
        },
      }),
    }),
  });
}

async function openEditor(page: Page) {
  await login(page);
  await page.goto(`/@@edit/${PAGE_ID}`);
  await waitForPlateEditorReady(page);
}

test('Login form', async ({ page }) => {
  await page.goto('/login');
  await settle(page);

  await expect(page).toHaveScreenshot('login.png');
});

test('Add form', async ({ page }) => {
  await login(page);
  await page.goto('/@@add?type=Document');
  await waitForPlateEditorReady(page);
  await settle(page);

  await expect(page).toHaveScreenshot('add-form.png');
});

test('Edit form with the metadata fields', async ({ page }) => {
  await createPage(page);
  await openEditor(page);
  await page.getByRole('tab', { name: 'Content' }).click();
  await settle(page);

  await expect(page).toHaveScreenshot('edit-form-metadata.png');
});

test('Edit form with the block settings sidebar', async ({ page }) => {
  await createContent(page, {
    contentType: 'Image',
    contentId: IMAGE_ID,
    contentTitle: 'Chrome image',
    image: {
      sourceFilename: 'halfdome2022.jpg',
      filename: 'halfdome2022.jpg',
      'content-type': 'image/jpeg',
    },
  });
  await createPage(page, [
    { type: 'title', children: [{ text: 'Chrome page' }] },
    { type: 'p', children: [{ text: 'Text before the image' }] },
    {
      type: PLONE_BLOCK_TYPE,
      '@type': 'image',
      url: `/${IMAGE_ID}`,
      children: [{ text: '' }],
    },
    { type: 'p', children: [{ text: 'Text after the image' }] },
  ]);
  await openEditor(page);

  const form = page.locator('#sidebar form');
  await expect(async () => {
    if ((await form.count()) === 0) {
      await page
        .locator(`img[src*="/${IMAGE_ID}/@@images/image"]`)
        .first()
        .click();
    }
    await expect(form).toHaveCount(1);
  }).toPass();
  await page.mouse.move(0, 0);
  await settle(page);

  await expect(page).toHaveScreenshot('edit-form-block-sidebar.png');
});

test('Sharing form', async ({ page }) => {
  await createPage(page);
  await login(page);
  await page.goto(`/@@sharing/${PAGE_ID}`);
  await expect(
    page.getByRole('heading', { name: 'Sharing for "Chrome page"' }),
  ).toBeVisible();
  await settle(page);

  await expect(page).toHaveScreenshot('sharing.png');
});

test('Control panels overview', async ({ page }) => {
  await login(page);
  await page.goto('/controlpanel');
  await expect(page.getByText('Control Panel').first()).toBeVisible();
  await settle(page);

  await expect(page).toHaveScreenshot('controlpanels.png');
});
