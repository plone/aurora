import type { Page } from '@playwright/test';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import { settle } from '../../../tooling/playwright/visual';

// The image block in its three alignments: floated left and right with text
// and a list wrapping around it, and centered with a link. Covers the image
// block's own layout and its effect on the blocks that follow a floated image.

const PAGE_ID = 'image-block-page';
const IMAGE_ID = 'image-block-image';
const TEXT =
  'Half Dome is a granite dome at the eastern end of Yosemite Valley. ' +
  'It is a well-known rock formation in the park, named for its distinct ' +
  'shape. One side is a sheer face while the other three sides are smooth ' +
  'and round, making it appear like a dome cut in half.';

const p = (text: string, props: Record<string, unknown> = {}) => ({
  type: 'p',
  ...props,
  children: [{ text }],
});

const image = (props: Record<string, unknown>) => ({
  type: PLONE_BLOCK_TYPE,
  '@type': 'image',
  url: `/${IMAGE_ID}`,
  ...props,
  children: [{ text: '' }],
});

async function createImagePage(page: Page) {
  await createContent(page, {
    contentType: 'Image',
    contentId: IMAGE_ID,
    contentTitle: 'Half Dome',
    image: {
      sourceFilename: 'halfdome2022.jpg',
      filename: 'halfdome2022.jpg',
      'content-type': 'image/jpeg',
    },
  });
  await createContent(page, {
    contentType: 'Document',
    contentId: PAGE_ID,
    contentTitle: 'Image block',
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: 'Image block' }] },
            image({ align: 'left', size: 'm', blockWidth: 'default' }),
            p(TEXT),
            p('Wrapping list item', { indent: 1, listStyleType: 'disc' }),
            p('Another wrapping item', { indent: 1, listStyleType: 'disc' }),
            p(TEXT),
            image({ align: 'right', size: 's', blockWidth: 'default' }),
            p(TEXT),
            p(TEXT),
            image({
              align: 'center',
              size: 'l',
              blockWidth: 'default',
              href: [{ '@id': 'https://plone.org' }],
            }),
            p(TEXT),
          ],
        },
      },
    }),
  });
}

test('Image block alignments in the public view', async ({ page }) => {
  await createImagePage(page);
  await page.goto(`/${PAGE_ID}`);
  await expect(
    page.locator(`img[src*="/${IMAGE_ID}/@@images/image"]`),
  ).toHaveCount(3);
  await settle(page);

  await expect(page).toHaveScreenshot('image-block-view.png', {
    fullPage: true,
  });
});

test('Image block alignments in the editor, floated image selected', async ({
  page,
}) => {
  await createImagePage(page);
  await login(page);
  await page.goto(`/@@edit/${PAGE_ID}`);
  await waitForPlateEditorReady(page);

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

  await expect(page.locator('[data-slate-editor]')).toHaveScreenshot(
    'image-block-edit.png',
  );
});
