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
};

/**
 * Creates one published Document whose somersault value contains the title
 * block followed by the requested fixture sections, in order.
 *
 * The backend is reset around every test, so each test creates exactly the
 * page it needs through the REST API (a few milliseconds) instead of relying
 * on a shared example site.
 */
export async function createNativeBlocksPage(
  page: Page,
  sections: NativeBlockSection[],
  { title = 'Native blocks', extra = [] }: CreatePageOptions = {},
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
            { type: 'title', children: [{ text: title }] },
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
