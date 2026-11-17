import type { Page } from '@playwright/test';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import {
  plainElementMargin,
  removeBaseLayer,
} from '../../../tooling/playwright/resets';

// The image block's styles come from `styles/content.css`, which both user
// interfaces load in the `plone-content` cascade layer. These tests check that
// a theme's content tokens reach the block in both of them, and that the block
// lays out the same whatever reset the public theme brings.

const PAGE_ID = 'image-content-css';
const IMAGE_ID = 'image-content-css-image';
const TEXT =
  'Half Dome is a granite dome at the eastern end of Yosemite Valley. ' +
  'One side is a sheer face while the other three sides are smooth and round.';

const imageNode = (props: Record<string, unknown>) => ({
  type: PLONE_BLOCK_TYPE,
  '@type': 'image',
  url: `/${IMAGE_ID}`,
  blockWidth: 'default',
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
    contentTitle: 'Image content CSS',
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: 'Image content CSS' }] },
            // The floated image goes last: a centered image right after a
            // float is pushed below it, by an amount that depends on how
            // tall the text next to the float is, which varies with fonts.
            imageNode({
              align: 'center',
              size: 'l',
              href: [{ '@id': 'https://plone.org' }],
            }),
            { type: 'p', children: [{ text: TEXT }] },
            imageNode({ align: 'left', size: 'm' }),
            { type: 'p', children: [{ text: TEXT }] },
          ],
        },
      },
    }),
  });
}

async function waitForImages(page: Page) {
  const images = page.locator(`img[src*="/${IMAGE_ID}/@@images/image"]`);
  await expect(images).toHaveCount(2);
  await expect
    .poll(() =>
      images.evaluateAll((imgs) =>
        imgs.every((img) => (img as HTMLImageElement).complete),
      ),
    )
    .toBe(true);
}

const floatMaxSize = (page: Page) =>
  page
    .locator('.block-image__frame')
    .first()
    .evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--block-float-max-size').trim(),
    );

test('theme content tokens reach the image block in both user interfaces', async ({
  page,
}) => {
  await createImagePage(page);

  // The framework only reads `--block-float-max-size` with a fallback and
  // never declares it, so a value can only come from Agave's content styles.
  await page.goto(`/${PAGE_ID}`);
  await waitForImages(page);
  expect(await floatMaxSize(page)).toBe('66%');

  await login(page);
  await page.goto(`/@@edit/${PAGE_ID}`);
  await waitForPlateEditorReady(page);
  await waitForImages(page);
  expect(await floatMaxSize(page)).toBe('66%');
});

// Geometry of each image block relative to its inner container, plus the
// computed styles the block sets itself.
const measure = (page: Page) =>
  page.locator('.block-image__frame').evaluateAll((figures) =>
    figures.map((figure) => {
      const container = figure.closest('.block-inner-container')!;
      const box = container.getBoundingClientRect();
      const rect = figure.getBoundingClientRect();
      const img = figure.querySelector('img')!.getBoundingClientRect();
      const style = getComputedStyle(figure);
      return {
        left: Math.round(rect.left - box.left),
        top: Math.round(rect.top - box.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        imageWidth: Math.round(img.width),
        imageHeight: Math.round(img.height),
        float: style.float,
        margin: style.margin,
        imageDisplay: getComputedStyle(figure.querySelector('img')!).display,
      };
    }),
  );

// A different, non-Tailwind reset in the `base` layer, with values that
// differ from Tailwind's preflight on the elements the image block uses.
const ALTERNATIVE_RESET = `
@layer base {
  *, *::before, *::after { box-sizing: content-box; }
  figure { margin: 2em 3em; }
  img { display: inline; max-width: none; vertical-align: baseline; }
  a { display: inline; }
}`;

test('the image block lays out the same under any public theme reset', async ({
  page,
}) => {
  await createImagePage(page);
  await page.goto(`/${PAGE_ID}`);
  await waitForImages(page);

  const withPreflight = await measure(page);
  expect(withPreflight).toHaveLength(2);
  expect(withPreflight[0].float).toBe('none');
  expect(withPreflight[1].float).toBe('left');
  expect(await plainElementMargin(page, 'figure')).toBe('0px');

  // No reset: the browser's default styles apply.
  expect(await removeBaseLayer(page)).toBeGreaterThan(0);
  expect(await plainElementMargin(page, 'figure')).toBe('16px 40px');
  expect(await measure(page)).toEqual(withPreflight);

  // A different reset.
  await page.addStyleTag({ content: ALTERNATIVE_RESET });
  expect(await plainElementMargin(page, 'figure')).toBe('32px 48px');
  expect(await measure(page)).toEqual(withPreflight);
});
