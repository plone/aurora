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

async function createImage(page: Page, imageId: string) {
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
}

async function createImagePage(
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

async function setupStyledImagePage(
  page: Page,
  args: { pageId: string; imageId: string; imageBlock?: ImageBlockOverrides },
) {
  await createImage(page, args.imageId);
  await createImagePage(page, args);
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

// Rendered width of the image relative to its column (the inner container).
async function widthRatio(page: Page) {
  return page
    .locator('.image-block')
    .first()
    .evaluate((el) => {
      const inner = el.closest('.block-inner-container') as HTMLElement | null;
      const container = inner ?? (el.parentElement as HTMLElement);
      return (
        el.getBoundingClientRect().width /
        container.getBoundingClientRect().width
      );
    });
}

function radio(page: Page, name: string) {
  return page.getByRole('radio', { name, exact: true });
}

// Ensure the block's settings sidebar is open. Selecting is idempotent: it only
// clicks the image when the sidebar is closed, and retries because changing a
// style field re-renders (and deselects) the block asynchronously.
async function selectBlock(page: Page, imageId: string) {
  const form = page.locator('#sidebar form');
  await expect(async () => {
    if ((await form.count()) === 0) {
      await imageLocator(page, imageId).click();
    }
    await expect(form).toHaveCount(1);
  }).toPass();
}

// Select the block (if needed) and click a settings radio, as one retrying unit.
// A previous change may still be deselecting the block, so the whole
// select-then-click is retried until the radio is actually clicked.
async function setRadio(page: Page, imageId: string, name: string) {
  const form = page.locator('#sidebar form');
  await expect(async () => {
    if ((await form.count()) === 0) {
      await imageLocator(page, imageId).click();
    }
    await radio(page, name).click({ force: true, timeout: 2_000 });
  }).toPass();
}

async function expectNode(
  page: Page,
  editorHandle: Awaited<ReturnType<typeof getEditorHandle>>,
  expected: { align: string; blockWidth: string; size: string },
) {
  await expect
    .poll(async () => {
      const node = await readImageBlock(page, editorHandle);
      return JSON.stringify({
        align: node.align,
        blockWidth: node.blockWidth,
        size: node.size,
      });
    })
    .toBe(JSON.stringify(expected));
}

test('centered large image is full width with no float and every control', async ({
  page,
}) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-centered',
    imageId: 'styled-image-centered',
    imageBlock: { align: 'center', size: 'l', blockWidth: 'default' },
  });
  await openImageBlockEditor(page, 'image-style-centered');
  await selectImageBlock(page, 'styled-image-centered');

  // Every size and an editable width are available.
  await expect(radio(page, 'Small')).toBeVisible();
  await expect(radio(page, 'Medium')).toBeVisible();
  await expect(radio(page, 'Large')).toBeVisible();
  await expect(radio(page, 'Default')).toBeEnabled();

  // Centered large fills its column and does not float.
  await expect(page.locator('.image-block').first()).toHaveCSS('float', 'none');
  expect(await widthRatio(page)).toBeGreaterThan(0.95);
});

test('floating left leaves width and size untouched and floats large', async ({
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

  // Only the alignment changes; width and size are left as they were.
  await expect
    .poll(async () => {
      const node = await readImageBlock(page, editorHandle);
      return JSON.stringify({
        align: node.align,
        blockWidth: node.blockWidth,
        size: node.size,
      });
    })
    .toBe(JSON.stringify({ align: 'left', blockWidth: 'layout', size: 'l' }));

  // The image floats and, even at the large size, is capped so content wraps.
  await expect(page.locator('.image-block').first()).toHaveCSS('float', 'left');
  expect(await widthRatio(page)).toBeLessThan(0.9);

  // Every size stays available and the width control stays editable.
  await selectImageBlock(page, 'styled-image-left');
  await expect(radio(page, 'Default')).toBeEnabled();
  await expect(radio(page, 'Small')).toBeVisible();
  await expect(radio(page, 'Medium')).toBeVisible();
  await expect(radio(page, 'Large')).toBeVisible();
});

test('floating right floats large with all size and width controls available', async ({
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
    .toBe(JSON.stringify({ align: 'right', blockWidth: 'default', size: 'l' }));

  await expect(page.locator('.image-block').first()).toHaveCSS(
    'float',
    'right',
  );
  expect(await widthRatio(page)).toBeLessThan(0.9);

  await selectImageBlock(page, 'styled-image-right');
  await expect(radio(page, 'Default')).toBeEnabled();
  await expect(radio(page, 'Large')).toBeVisible();
});

test('block width is editable and independent while floated', async ({
  page,
}) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-width',
    imageId: 'styled-image-width',
    imageBlock: { align: 'left', size: 'l', blockWidth: 'default' },
  });
  const editorHandle = await openImageBlockEditor(page, 'image-style-width');
  await selectImageBlock(page, 'styled-image-width');

  // Width options are enabled even though the image is floated.
  await expect(radio(page, 'Default')).toBeEnabled();
  await expect(radio(page, 'Layout')).toBeEnabled();
  await expect(radio(page, 'Narrow')).toBeEnabled();
  await expect(radio(page, 'Full')).toBeEnabled();

  // Changing the width persists and leaves alignment and size untouched.
  await radio(page, 'Layout').click({ force: true });
  await expect
    .poll(async () => {
      const node = await readImageBlock(page, editorHandle);
      return JSON.stringify({
        align: node.align,
        blockWidth: node.blockWidth,
        size: node.size,
      });
    })
    .toBe(JSON.stringify({ align: 'left', blockWidth: 'layout', size: 'l' }));
});

test('floated sizes scale up, with large capped so it still floats', async ({
  page,
}) => {
  test.slow(); // creates and renders three pages
  await login(page);
  await createImage(page, 'styled-image-scale');

  const ratios: Record<string, number> = {};
  for (const size of ['s', 'm', 'l'] as const) {
    await createImagePage(page, {
      pageId: `image-style-scale-${size}`,
      imageId: 'styled-image-scale',
      imageBlock: { align: 'left', size },
    });
    await page.goto(`/image-style-scale-${size}`);
    const block = page.locator('.image-block').first();
    await expect(block).toBeVisible();
    // Confirms the style fields are applied in the published view too.
    await expect(block).toHaveCSS('float', 'left');
    ratios[size] = await widthRatio(page);
  }

  expect(ratios.s).toBeLessThan(ratios.m);
  expect(ratios.m).toBeLessThan(ratios.l);
  expect(ratios.l).toBeLessThan(0.9); // large stays capped, so it keeps floating
});

test('walking through every alignment and size combination in one session', async ({
  page,
}) => {
  test.slow(); // exercises many combinations in sequence
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-walk',
    imageId: 'styled-image-walk',
    imageBlock: { align: 'center', size: 'l', blockWidth: 'default' },
  });
  const editorHandle = await openImageBlockEditor(page, 'image-style-walk');
  const block = page.locator('.image-block').first();

  // Center + large: no float, full width, all controls available.
  await selectBlock(page, 'styled-image-walk');
  await expect(block).toHaveCSS('float', 'none');
  expect(await widthRatio(page)).toBeGreaterThan(0.95);
  await expect(radio(page, 'Large')).toBeVisible();
  await expect(radio(page, 'Default')).toBeEnabled();

  // -> Left: floats, large stays capped, width and size are preserved.
  await setRadio(page, 'styled-image-walk', 'Left');
  await expectNode(page, editorHandle, {
    align: 'left',
    blockWidth: 'default',
    size: 'l',
  });
  await expect(block).toHaveCSS('float', 'left');
  expect(await widthRatio(page)).toBeLessThan(0.9);

  // -> Small (still left).
  await setRadio(page, 'styled-image-walk', 'Small');
  await expectNode(page, editorHandle, {
    align: 'left',
    blockWidth: 'default',
    size: 's',
  });
  const smallRatio = await widthRatio(page);

  // -> Medium (still left): wider than small.
  await setRadio(page, 'styled-image-walk', 'Medium');
  await expectNode(page, editorHandle, {
    align: 'left',
    blockWidth: 'default',
    size: 'm',
  });
  expect(await widthRatio(page)).toBeGreaterThan(smallRatio);

  // -> Right: floats to the other side.
  await setRadio(page, 'styled-image-walk', 'Right');
  await expectNode(page, editorHandle, {
    align: 'right',
    blockWidth: 'default',
    size: 'm',
  });
  await expect(block).toHaveCSS('float', 'right');

  // -> Center: float released, large offered again.
  await setRadio(page, 'styled-image-walk', 'Center');
  await expectNode(page, editorHandle, {
    align: 'center',
    blockWidth: 'default',
    size: 'm',
  });
  await expect(block).toHaveCSS('float', 'none');

  // -> Large (centered): full width again.
  await selectBlock(page, 'styled-image-walk');
  await expect(radio(page, 'Large')).toBeVisible();
  await setRadio(page, 'styled-image-walk', 'Large');
  await expectNode(page, editorHandle, {
    align: 'center',
    blockWidth: 'default',
    size: 'l',
  });
  expect(await widthRatio(page)).toBeGreaterThan(0.95);
});

test('combinations set in the editor render correctly after saving', async ({
  page,
}) => {
  await login(page);
  await setupStyledImagePage(page, {
    pageId: 'image-style-save',
    imageId: 'styled-image-save',
    imageBlock: { align: 'center', size: 'l', blockWidth: 'default' },
  });
  const editorHandle = await openImageBlockEditor(page, 'image-style-save');
  await selectImageBlock(page, 'styled-image-save');

  // Change to a left-floated large image (a combination that differs from the
  // seeded, centered state) so the assertion proves the save actually landed.
  await radio(page, 'Left').click({ force: true });
  await expectNode(page, editorHandle, {
    align: 'left',
    blockWidth: 'default',
    size: 'l',
  });

  // Save the block via the toolbar and wait for the request to complete.
  const saved = page.waitForResponse(
    (r) => ['PATCH', 'POST'].includes(r.request().method()) && r.ok(),
    { timeout: 15_000 },
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;

  // The published view reflects the saved combination: floated left, capped.
  await page.goto('/image-style-save');
  const block = page.locator('.image-block').first();
  await expect(block).toBeVisible();
  await expect(block).toHaveCSS('float', 'left');
  expect(await widthRatio(page)).toBeLessThan(0.9);
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
