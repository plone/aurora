import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import {
  focusBlockStart,
  getValue,
  type EditorHandle,
} from '../fixtures/editor';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnSUs8AAAAASUVORK5CYII=';

const FILE_NAME = 'clipboard-image.png';

/**
 * Dispatches a paste or drop event carrying an image file on the top-level
 * block at `index`. Synthetic paste events don't expose `clipboardData` to
 * handlers unless it is defined on the event.
 */
async function transferImage(
  page: Page,
  editorHandle: EditorHandle,
  index: number,
  type: 'paste' | 'drop',
) {
  await page.evaluate(
    ([editor, { base64, index, name, type }]: [any, any]) => {
      const element: HTMLElement = editor.api.toDOMNode(editor.children[index]);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([bytes], name, { type: 'image/png' }));

      if (type === 'paste') {
        const event = new Event('paste', { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'clipboardData', { value: dataTransfer });
        element.dispatchEvent(event);
        return;
      }

      const { left, top } = element.getBoundingClientRect();
      element.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          clientX: left + 1,
          clientY: top + 1,
        }),
      );
    },
    [editorHandle, { base64: PNG_BASE64, index, name: FILE_NAME, type }] as [
      any,
      any,
    ],
  );
}

const blockSummary = async (page: Page, editorHandle: EditorHandle) =>
  (await getValue(page, editorHandle))
    .filter((node) => node.type !== 'title')
    .map(({ type, url, alt, ...node }) =>
      type === 'ploneBlock'
        ? { type, blockType: node['@type'], url, alt }
        : { type },
    );

for (const type of ['paste', 'drop'] as const) {
  test(`Image ${type} uploads the image and inserts an image block`, async ({
    page,
  }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, [], {
      extra: [{ type: 'p', children: [{ text: '' }] }],
    });
    await openInEditor(page, pageId);
    const editorHandle = await getEditorHandle(page);

    await focusBlockStart(page, editorHandle, 1);

    await transferImage(page, editorHandle, 1, type);

    const imagePath = `/${pageId}/${FILE_NAME}`;

    // The image replaces the empty paragraph it was pasted or dropped on.
    await expect
      .poll(() => blockSummary(page, editorHandle))
      .toEqual([
        {
          type: 'ploneBlock',
          blockType: 'image',
          url: imagePath,
          alt: FILE_NAME,
        },
        { type: 'p' },
      ]);

    const image = page.locator(`[data-slate-editor] img[alt="${FILE_NAME}"]`);
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', `${imagePath}/@@images/image`);
    // The uploaded image loads, so it isn't rendered broken.
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);

    // A single undo restores the empty paragraph.
    await page.evaluate((editor: any) => editor.undo(), editorHandle);
    await expect
      .poll(() => blockSummary(page, editorHandle))
      .toEqual([{ type: 'p' }]);
  });
}
