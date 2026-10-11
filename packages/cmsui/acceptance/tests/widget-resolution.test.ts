import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';

test('The edit form resolves image and boolean fields to their widgets', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'News Item',
    contentId: 'widget-news',
    contentTitle: 'Widget news',
  });

  await page.goto('/@@edit/widget-news', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();

  // The lead image is an `Image` factory field: it stores the image file.
  await expect(
    page.locator('input[type="file"][name="image"][accept="image/*"]'),
  ).toHaveCount(1);

  // Boolean fields resolve by their `boolean` type.
  await page.locator('button', { hasText: /^Settings$/ }).click();
  await expect(
    page.locator('label', { hasText: 'Exclude from navigation' }),
  ).toBeVisible();
  await expect(
    page.locator('input[type="checkbox"][name="exclude_from_nav"]'),
  ).toHaveCount(1);
});

test('A page summary is edited in a multi-line text area', async ({ page }) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'summary-page',
    contentTitle: 'Summary page',
  });

  await page.goto('/@@edit/summary-page', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();

  // plone.restapi sends `widget: 'textarea'` for the description field.
  const summary = page.getByRole('textbox', { name: 'Summary' });
  await expect(summary).toBeVisible();
  expect(await summary.evaluate((element) => element.tagName)).toBe('TEXTAREA');
});

test('The image widget browses from the edited page', async ({ page }) => {
  await login(page);
  await createContent(page, {
    // With plone.volto, pages are folderish.
    contentType: 'Document',
    contentId: 'album',
    contentTitle: 'Album',
  });
  await createContent(page, {
    contentType: 'Image',
    contentId: 'sunrise',
    contentTitle: 'Sunrise',
    path: 'album',
    image: true,
  });
  await createContent(page, {
    contentType: 'Document',
    contentId: 'album-page',
    contentTitle: 'Album page',
    path: 'album',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: 'Album page' }] },
            {
              type: PLONE_BLOCK_TYPE,
              '@type': 'image',
              children: [{ text: '' }],
            },
          ],
        },
      },
      blocks_layout: { items: ['__somersault__'] },
    }),
  });

  await page.goto('/@@edit/album/album-page', { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
  await page
    .locator('#toolbar')
    .getByRole('button', { name: 'Settings' })
    .click();

  // The object browser starts at the edited page, and shows where it is
  // (#163: it used to guess its location from the URL).
  await page.getByRole('button', { name: 'Pick an existing image' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'Album page' })).toBeVisible();
  // From there, the editor goes up to the folder, and finds its image.
  await dialog.getByRole('link', { name: 'Album', exact: true }).click();
  await expect(dialog.getByText('Sunrise')).toBeVisible();
});
