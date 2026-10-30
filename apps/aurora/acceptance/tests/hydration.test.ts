import { expect, test } from '../../../../packages/tooling/playwright/test';
import type { Page } from '@playwright/test';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { createContent } from '../../../../packages/tooling/playwright/content';

// If the server and client renders differ, React discards the server-rendered
// DOM on hydration and renders it again on the client. Any element a test (or
// script) grabbed before that is then detached and measures 0x0.

const PAGE_ID = 'hydration-page';
const IMAGE_ID = 'hydration-image';

async function setupImageBlockPage(page: Page) {
  await createContent(page, {
    contentType: 'Image',
    contentId: IMAGE_ID,
    contentTitle: 'Hydration image',
    image: {
      sourceFilename: 'halfdome2022.jpg',
      filename: 'halfdome2022.jpg',
      'content-type': 'image/jpeg',
    },
  });
  await createContent(page, {
    contentType: 'Document',
    contentId: PAGE_ID,
    contentTitle: 'Hydration page',
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: 'Hydration page' }] },
            { type: 'p', children: [{ text: 'Text before image' }] },
            {
              type: PLONE_BLOCK_TYPE,
              '@type': 'image',
              url: `/${IMAGE_ID}`,
              align: 'left',
              size: 'l',
              blockWidth: 'default',
              children: [{ text: '' }],
            },
            { type: 'p', children: [{ text: 'Text after image' }] },
          ],
        },
      },
    }),
  });
}

test.describe('Hydration', () => {
  test('the server renders translated messages', async ({ page }) => {
    const html = await (await page.request.get('/')).text();
    expect(
      html.includes('layout.slots.headertools.anonymousTools.login'),
      'the server rendered a raw message key',
    ).toBe(false);
    expect(html.includes('>Log In<'), 'the server rendered "Log In"').toBe(
      true,
    );
  });

  test('the server-rendered image block survives hydration', async ({
    page,
  }) => {
    await setupImageBlockPage(page);

    // Keep a reference to the server-rendered node, before React hydrates.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        (window as any).__ssrImageBlock = document.querySelector(
          '.block-image__frame',
        );
      });
    });
    await page.goto(`/${PAGE_ID}`);

    // Wait until React owns the current `.block-image__frame`, i.e. hydration (or a
    // client re-render after a failed hydration) has finished.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const el = document.querySelector('.block-image__frame');
          return (
            !!el && Object.keys(el).some((k) => k.startsWith('__reactFiber'))
          );
        }),
      )
      .toBe(true);

    const result = await page.evaluate(() => {
      const ssr = (window as any).__ssrImageBlock as HTMLElement | null;
      return {
        found: !!ssr,
        connected: !!ssr?.isConnected,
        same: ssr === document.querySelector('.block-image__frame'),
        width: ssr?.getBoundingClientRect().width ?? 0,
      };
    });
    expect(result).toMatchObject({ found: true, connected: true, same: true });
    expect(result.width).toBeGreaterThan(0);
  });
});
