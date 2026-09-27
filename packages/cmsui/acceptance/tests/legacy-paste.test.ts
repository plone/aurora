import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import {
  selectPlateEditorPoint,
  waitForPlateEditorReady,
} from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

const PAGE_TITLE = 'Legacy paste edit page';

// A fragment shaped like content copied out of a legacy volto-slate editor:
// `strong`/`em`/`del` element wrappers, a `link` element with `data.url`, and
// `ul`/`li` list wrappers. None of these are valid Plate shapes.
const LEGACY_SLATE_FRAGMENT = [
  {
    type: 'p',
    children: [
      { type: 'strong', children: [{ text: 'BoldPasted' }] },
      { text: ' ' },
      {
        type: 'link',
        data: { url: 'https://plone.org', target: '_blank' },
        children: [{ text: 'LinkPasted' }],
      },
    ],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'ItemOne' }] },
      { type: 'li', children: [{ text: 'ItemTwo' }] },
    ],
  },
];

async function setupPastePage(page: Parameters<typeof test>[0]['page']) {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const pageId = `legacy-paste-edit-page-${suffix}`;

  await createContent(page, {
    contentType: 'Document',
    contentId: pageId,
    contentTitle: PAGE_TITLE,
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: PAGE_TITLE }] },
            { type: 'p', children: [{ text: '' }] },
          ],
        },
      },
      blocks_layout: {
        items: ['__somersault__'],
      },
    }),
  });

  await page.goto(`/@@edit/${pageId}`);
  await waitForPlateEditorReady(page);

  return { pageId };
}

/**
 * Simulate a real paste of a legacy Slate fragment.
 *
 * Mirrors how a legacy volto-slate editor writes the clipboard — JSON →
 * encodeURIComponent → btoa under the `application/x-slate-fragment` MIME type —
 * and drives the editor's own `insertData`, which is exactly what Slate's paste
 * handler calls. This exercises the real clipboard-decode path plus the
 * `LegacyPastePlugin` `insertFragment` boundary. (A synthetic `ClipboardEvent`
 * can't be used here: untrusted events don't expose `clipboardData` to the
 * handler.)
 */
async function pasteLegacySlateFragment(
  page: Parameters<typeof test>[0]['page'],
  editorHandle: Awaited<ReturnType<typeof getEditorHandle>>,
  fragment: unknown,
) {
  await page.evaluate(
    ([editor, fragmentJson]: [any, string]) => {
      const encoded = window.btoa(encodeURIComponent(fragmentJson));
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('application/x-slate-fragment', encoded);
      editor.tf.insertData(dataTransfer);
    },
    [editorHandle, JSON.stringify(fragment)] as [any, string],
  );
}

test('Pasting a legacy volto-slate fragment normalizes it to Plate shapes', async ({
  page,
}) => {
  await login(page);
  await setupPastePage(page);

  // Place the caret in the empty paragraph (path [1]) before pasting.
  const editorHandle = await getEditorHandle(page);
  await selectPlateEditorPoint(page, editorHandle, { path: [1, 0], offset: 0 });

  await pasteLegacySlateFragment(page, editorHandle, LEGACY_SLATE_FRAGMENT);

  // Legacy `link` + `data.url` must become a Plate `a` with a real href.
  // This only renders if the paste boundary normalized the fragment.
  await expect(
    page.locator('[data-slate-editor] a[href="https://plone.org"]'),
  ).toHaveText('LinkPasted');

  // Legacy `strong` wrapper must become a bold mark (rendered as <strong>).
  await expect(
    page.locator('[data-slate-editor] strong', { hasText: 'BoldPasted' }),
  ).toBeVisible();

  // Legacy `ul`/`li` items must survive as list content.
  await expect(page.locator('[data-slate-editor]')).toContainText('ItemOne');
  await expect(page.locator('[data-slate-editor]')).toContainText('ItemTwo');

  // No legacy element types should remain in the editor value.
  const serialized = await page.evaluate(() => {
    const el = document.querySelector('[data-slate-editor]') as HTMLElement;
    const editor = window.platePlaywrightAdapter?.EDITABLE_TO_EDITOR?.get(
      el,
    ) as { children?: unknown } | undefined;
    return JSON.stringify(editor?.children ?? []);
  });
  expect(serialized).not.toContain('"strong"');
  expect(serialized).not.toContain('"data":{"url"');
  expect(serialized).not.toMatch(/"type":"ul"/);
});
