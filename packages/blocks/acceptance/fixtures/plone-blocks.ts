import type { Page } from '@playwright/test';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { createContent } from '../../../tooling/playwright/content';

// A page with one of each Plone block that renders content: image, video,
// teaser, listing (both variations) and maps. External embeds are answered
// with a blank page, so screenshots don't depend on the network.

export const PLONE_BLOCKS_PAGE_ID = 'plone-blocks-page';
const IMAGE_ID = 'plone-blocks-image';
const VIDEO_URL = 'https://www.youtube.com/watch?v=KqjeO_ekW3g';
const MAP_URL = 'https://maps.example.com/embed?location=Bucharest';

const EMBED_ORIGINS = [
  'https://www.youtube.com/**',
  'https://maps.example.com/**',
];

const ploneBlock = (type: string, data: Record<string, unknown>) => ({
  type: PLONE_BLOCK_TYPE,
  '@type': type,
  ...data,
  children: [{ text: '' }],
});

const p = (text: string) => ({ type: 'p', children: [{ text }] });

/**
 * Answers the embeds' requests with an empty page. It looks the same loaded
 * or not, so screenshots don't depend on when the frames paint.
 */
export async function routeEmbeds(page: Page) {
  for (const origin of EMBED_ORIGINS) {
    await page.route(origin, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Embed</title>',
      }),
    );
  }
}

export async function createPloneBlocksPage(page: Page) {
  const imageResponse = await createContent(page, {
    contentType: 'Image',
    contentId: IMAGE_ID,
    contentTitle: 'Half Dome',
    image: {
      sourceFilename: 'halfdome2022.jpg',
      filename: 'halfdome2022.jpg',
      'content-type': 'image/jpeg',
    },
  });
  const imageContent = await imageResponse.json();

  await createContent(page, {
    contentType: 'Document',
    contentId: PLONE_BLOCKS_PAGE_ID,
    contentTitle: 'Plone blocks',
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: 'Plone blocks' }] },
            p('An image block.'),
            ploneBlock('image', {
              url: `/${IMAGE_ID}`,
              align: 'center',
              size: 's',
              blockWidth: 'default',
              alt: 'Half Dome',
            }),
            p('A video block.'),
            ploneBlock('video', { url: VIDEO_URL }),
            p('A teaser block.'),
            ploneBlock('teaser', {
              href: [
                {
                  '@id': `/${IMAGE_ID}`,
                  title: 'Half Dome',
                  description: 'A granite dome in Yosemite Valley.',
                },
              ],
              preview_image: [
                { '@id': imageContent['@id'], image: imageContent.image },
              ],
              title: 'Half Dome',
              description: 'A granite dome in Yosemite Valley.',
            }),
            p('A listing block.'),
            ploneBlock('listing', {
              headline: 'Listing',
              items: [
                {
                  '@id': '/first-item',
                  id: 'first-item',
                  title: 'First item',
                  description: 'The first item of the listing.',
                },
                {
                  '@id': '/second-item',
                  id: 'second-item',
                  title: 'Second item',
                  description: '',
                },
              ],
            }),
            ploneBlock('listing', {
              variation: 'summary',
              items: [
                {
                  '@id': '/summary-item',
                  id: 'summary-item',
                  title: 'Summary item',
                  description: 'An item in the summary variation.',
                },
              ],
            }),
            p('A maps block.'),
            ploneBlock('maps', { url: MAP_URL, title: 'A map' }),
            p('After the blocks.'),
          ],
        },
      },
      blocks_layout: { items: ['__somersault__'] },
    }),
  });

  return PLONE_BLOCKS_PAGE_ID;
}
