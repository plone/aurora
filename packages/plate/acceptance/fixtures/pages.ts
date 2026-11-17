import type { Page } from '@playwright/test';

import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import { SOMERSAULT_KEY } from '../../constants';
import { nativeBlockSections, type NativeBlockSection } from './native-blocks';

type CreatePageOptions = {
  /** Page title, also rendered by the title block. */
  title?: string;
  /** Extra Plate nodes appended after the requested sections. */
  extra?: Record<string, unknown>[];
  /** Start the value with the title block (default). */
  withTitle?: boolean;
};

/**
 * Creates one published Document whose somersault value contains the title
 * block (unless `withTitle` is false) followed by the requested fixture
 * sections, in order.
 *
 * The backend is reset around every test, so each test creates exactly the
 * page it needs through the REST API (a few milliseconds) instead of relying
 * on a shared example site.
 */
export async function createNativeBlocksPage(
  page: Page,
  sections: NativeBlockSection[],
  {
    title = 'Native blocks',
    extra = [],
    withTitle = true,
  }: CreatePageOptions = {},
) {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const pageId = `native-blocks-${suffix}`;

  await createContent(page, {
    contentType: 'Document',
    contentId: pageId,
    contentTitle: title,
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      // Aurora only reads the somersault block; `blocks_layout` isn't used.
      blocks: {
        [SOMERSAULT_KEY]: {
          '@type': SOMERSAULT_KEY,
          value: [
            ...(withTitle
              ? [{ type: 'title', children: [{ text: title }] }]
              : []),
            ...sections.flatMap((section) => nativeBlockSections[section]),
            ...extra,
          ],
        },
      },
    }),
  });

  return pageId;
}

/** Opens the page in the editor and waits for Plate to be ready. */
export async function openInEditor(page: Page, pageId: string) {
  await page.goto(`/@@edit/${pageId}`);
  await waitForPlateEditorReady(page);
}

/** Opens the public view of the page. */
export async function openInView(page: Page, pageId: string) {
  await page.goto(`/${pageId}`);
  await page.locator('[data-slate-editor]').first().waitFor();
}

/** Saves the open edit form and waits for the backend to store it. */
export async function savePage(page: Page) {
  const saved = page.waitForResponse(
    (response) =>
      ['PATCH', 'POST'].includes(response.request().method()) && response.ok(),
    { timeout: 15_000 },
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;
}

/** Reads the somersault value of a page straight from the REST API. */
export async function getStoredValue(page: Page, pageId: string) {
  const hostname = process.env.BACKEND_HOST || '127.0.0.1';
  const siteId = process.env.SITE_ID || 'plone';
  const apiURL = process.env.API_PATH || `http://${hostname}:55001/${siteId}`;
  const response = await page.request.get(`${apiURL}/${pageId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
    },
  });
  const content = await response.json();

  return content.blocks[SOMERSAULT_KEY].value as Record<string, unknown>[];
}
