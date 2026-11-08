import type { Page } from '@playwright/test';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { expect } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';

// The `objectListTest` block comes from `@plone/test-addon`, which the app
// loads when it's built with `PLONE_TEST_ADDON=1`, as the acceptance Makefile
// targets do. Its settings have an accordion field (`actions`) and a table
// field (`links`).

export const API =
  process.env.API_PATH ||
  `http://${process.env.BACKEND_HOST || '127.0.0.1'}:55001/${process.env.SITE_ID || 'plone'}`;
const AUTH = `Basic ${Buffer.from('admin:secret').toString('base64')}`;

export const PAGE_ID = 'object-list-page';
// The block is the third node: [title, p (before), block, p (after)].
const BLOCK_INDEX = 2;

export type Item = Record<string, unknown>;

export const actions: Item[] = [
  { '@id': 'a1', title: 'Sitemap', href: '/sitemap', newTab: false },
  { '@id': 'a2', title: 'Accessibility', href: '/accessibility-info' },
  { '@id': 'a3', title: 'Contact', href: '/contact' },
];

export const links: Item[] = [
  {
    '@id': 'l1',
    network: 'mastodon',
    title: 'Plone on Mastodon',
    // The URL validator doesn't accept `@` in a path yet.
    href: 'https://fosstodon.org/plone',
  },
  {
    '@id': 'l2',
    network: 'github',
    title: 'GitHub',
    href: 'https://github.com/plone',
  },
];

/** Creates a page with the test block, and opens it in the editor. */
export async function openObjectListBlock(
  page: Page,
  data: { actions?: Item[]; links?: Item[] } = { actions, links },
) {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: PAGE_ID,
    contentTitle: 'Object list page',
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: 'Object list page' }] },
            { type: 'p', children: [{ text: 'Text before the block' }] },
            {
              type: PLONE_BLOCK_TYPE,
              '@type': 'objectListTest',
              ...data,
              children: [{ text: '' }],
            },
            { type: 'p', children: [{ text: 'Text after the block' }] },
          ],
        },
      },
      blocks_layout: { items: ['__somersault__'] },
    }),
  });
  await page.goto(`/@@edit/${PAGE_ID}`);
  await waitForPlateEditorReady(page);

  // Selecting the block shows its settings in the sidebar.
  const form = page.locator('#sidebar form');
  await expect(async () => {
    if ((await form.count()) === 0) {
      await page.locator('.object-list-test').first().click();
    }
    await expect(form).toHaveCount(1);
  }).toPass();
  return form;
}

/** Saves the page, and returns the test block's data as stored. */
export async function saveAndReadBlock(page: Page): Promise<Item> {
  const saved = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;

  const content = await (
    await page.request.get(`${API}/${PAGE_ID}`, {
      headers: { Accept: 'application/json', Authorization: AUTH },
    })
  ).json();
  return content.blocks.__somersault__.value[BLOCK_INDEX];
}
