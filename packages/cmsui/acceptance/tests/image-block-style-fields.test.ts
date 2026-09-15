import { expect, test } from '../../../tooling/playwright/test';
import type { Page } from '@playwright/test';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import { getEditorHandle, getNodeByPath } from '@platejs/playwright';

// The image block lives at index [2] in the somersault value:
// [title, p (before), image, p (after)].
const IMAGE_PATH = [2];

type ImageBlockOverrides = Record<string, unknown>;

async function setupStyledImagePage(
  page: Page,
  {
    pageId,
    imageId,
    imageBlock = {},
  }: {
    pageId: string;
    imageId: string;
    imageBlock?: ImageBlockOverrides;
  },
) {
  await createContent(page, {
    contentType: 'Image',
    contentId: imageId,
    contentTitle: 'Styled image',
    image: {
      sourceFilename: 'halfdome2022.jpg',
      filename: 'halfdome2022.jpg',
      'content-type': 'image/jpeg',
    },
  });

  await createContent(page, {
    contentType: 'Document',
    contentId: pageId,
    contentTitle: 'Styled image page',
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: 'Styled image page' }] },
            { type: 'p', children: [{ text: 'Text before image' }] },
            {
              type: PLONE_BLOCK_TYPE,
              '@type': 'image',
              url: `/${imageId}`,
              ...imageBlock,
              children: [{ text: '' }],
            },
            { type: 'p', children: [{ text: 'Text after image' }] },
          ],
        },
      },
      blocks_layout: { items: ['__somersault__'] },
    }),
  });
}

async function openImageBlockEditor(page: Page, pageId: string) {
  await page.goto(`/@@edit/${pageId}`);
  await page.reload();
  await waitForPlateEditorReady(page);
  return getEditorHandle(page);
}

function imageLocator(page: Page, imageId: string) {
  return page.locator(`img[src*="/${imageId}/@@images/image"]`).first();
}

async function selectImageBlock(page: Page, imageId: string) {
  await imageLocator(page, imageId).click();
  await expect(page.locator('#sidebar form')).toHaveCount(1);
}

async function readImageBlock(
  page: Page,
  editorHandle: Awaited<ReturnType<typeof getEditorHandle>>,
) {
  const handle = await getNodeByPath(page, editorHandle, IMAGE_PATH);
  return (await handle.jsonValue()) as Record<string, unknown>;
}

function radio(page: Page, name: string) {
  return page.getByRole('radio', { name, exact: true });
}

test('centered image offers every size and an editable width', async ({
  page,
}) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-centered',
    imageId: 'styled-image-centered',
    imageBlock: { align: 'center', size: 'l', blockWidth: 'layout' },
  });
  await openImageBlockEditor(page, 'image-style-centered');
  await selectImageBlock(page, 'styled-image-centered');

  // All three sizes are available.
  await expect(radio(page, 'Small')).toBeVisible();
  await expect(radio(page, 'Medium')).toBeVisible();
  await expect(radio(page, 'Large')).toBeVisible();

  // The width control is editable.
  await expect(radio(page, 'Default')).toBeEnabled();
});

test('switching to left couples width to default and coerces large to medium', async ({
  page,
}) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-left',
    imageId: 'styled-image-left',
    imageBlock: { align: 'center', size: 'l', blockWidth: 'layout' },
  });
  const editorHandle = await openImageBlockEditor(page, 'image-style-left');
  await selectImageBlock(page, 'styled-image-left');

  await radio(page, 'Left').click({ force: true });

  // The stored block data reflects the coupling.
  await expect
    .poll(async () => {
      const node = await readImageBlock(page, editorHandle);
      return JSON.stringify({
        align: node.align,
        blockWidth: node.blockWidth,
        size: node.size,
      });
    })
    .toBe(JSON.stringify({ align: 'left', blockWidth: 'default', size: 'm' }));

  // The image is floated and following content can wrap around it.
  await expect(page.locator('.image-block').first()).toHaveCSS('float', 'left');

  // The width control is disabled and large size is no longer offered.
  await selectImageBlock(page, 'styled-image-left');
  await expect(radio(page, 'Default')).toBeDisabled();
  await expect(radio(page, 'Large')).toHaveCount(0);
  await expect(radio(page, 'Small')).toBeVisible();
  await expect(radio(page, 'Medium')).toBeVisible();
});

test('switching to right floats right and keeps the width locked', async ({
  page,
}) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-right',
    imageId: 'styled-image-right',
    imageBlock: { align: 'center', size: 'l', blockWidth: 'default' },
  });
  const editorHandle = await openImageBlockEditor(page, 'image-style-right');
  await selectImageBlock(page, 'styled-image-right');

  await radio(page, 'Right').click({ force: true });

  await expect
    .poll(async () => {
      const node = await readImageBlock(page, editorHandle);
      return JSON.stringify({
        align: node.align,
        blockWidth: node.blockWidth,
        size: node.size,
      });
    })
    .toBe(JSON.stringify({ align: 'right', blockWidth: 'default', size: 'm' }));

  await expect(page.locator('.image-block').first()).toHaveCSS(
    'float',
    'right',
  );
});

test('a small floated image keeps its size', async ({ page }) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-small',
    imageId: 'styled-image-small',
    imageBlock: { align: 'center', size: 's', blockWidth: 'default' },
  });
  const editorHandle = await openImageBlockEditor(page, 'image-style-small');
  await selectImageBlock(page, 'styled-image-small');

  await radio(page, 'Left').click({ force: true });

  await expect
    .poll(async () => {
      const node = await readImageBlock(page, editorHandle);
      return JSON.stringify({ align: node.align, size: node.size });
    })
    .toBe(JSON.stringify({ align: 'left', size: 's' }));
});

test('returning to center re-enables the width and the large size', async ({
  page,
}) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-recenter',
    imageId: 'styled-image-recenter',
    imageBlock: { align: 'left', size: 'm', blockWidth: 'default' },
  });
  await openImageBlockEditor(page, 'image-style-recenter');
  await selectImageBlock(page, 'styled-image-recenter');

  // Starts floated: width disabled, no large size.
  await expect(radio(page, 'Default')).toBeDisabled();
  await expect(radio(page, 'Large')).toHaveCount(0);

  await radio(page, 'Center').click({ force: true });

  // Back to center: width editable and large size available again.
  await selectImageBlock(page, 'styled-image-recenter');
  await expect(radio(page, 'Default')).toBeEnabled();
  await expect(radio(page, 'Large')).toBeVisible();
  await expect(page.locator('.image-block').first()).toHaveCSS('float', 'none');
});

test('an image with a link wraps the rendered image in an anchor', async ({
  page,
}) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-linked',
    imageId: 'styled-image-linked',
    imageBlock: {
      align: 'center',
      size: 'l',
      href: [{ '@id': '/styled-image-linked' }],
      openLinkInNewTab: true,
    },
  });

  // View mode (published page) renders the image block view.
  await page.goto('/image-style-linked');

  const link = page.locator('.image-block a').first();
  await expect(link).toHaveAttribute('href', '/styled-image-linked');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(link.locator('img')).toBeVisible();
});
