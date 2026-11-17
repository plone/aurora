import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { getValue, nodeText } from '../fixtures/editor';

const editable = (page: Page) => page.locator('[data-slate-editor]');

const DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const p = (text: string) => ({ type: 'p', children: [{ text }] });

test('Dragging a Plone block moves it to the drop position', async ({
  page,
}) => {
  const domNodeErrors: string[] = [];
  page.on('pageerror', (error) => {
    if (error.message.includes('Cannot resolve a DOM node')) {
      domNodeErrors.push(error.message);
    }
  });

  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [
      p('First paragraph'),
      {
        type: 'ploneBlock',
        '@type': 'image',
        url: DATA_URI,
        alt: 'Draggable image',
        children: [{ text: '' }],
      },
      p('Second paragraph'),
    ],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  const image = editable(page).locator('img[alt="Draggable image"]');
  const target = editable(page).getByText('First paragraph');
  await expect(image).toBeVisible();

  // Playwright's mouse emulation stalls inside a real browser drag session,
  // so dispatch the drag events Slate listens to with one shared
  // DataTransfer, as the browser does.
  await image.evaluate(
    (source, dropTarget) => {
      const dataTransfer = new DataTransfer();
      if (!dropTarget) throw new Error('Drop target not found');
      const { left, top } = dropTarget.getBoundingClientRect();
      const at = { clientX: left + 1, clientY: top + 1 };
      const fire = (element: Element, type: string, point = {}) =>
        element.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            ...point,
          }),
        );

      fire(source, 'dragstart');
      fire(dropTarget, 'dragover', at);
      fire(dropTarget, 'drop', at);
      fire(source, 'dragend');
    },
    await target.elementHandle(),
  );

  await expect
    .poll(async () =>
      (await getValue(page, editorHandle)).map((node) =>
        node.type === 'ploneBlock' ? `[${node['@type']}]` : nodeText(node),
      ),
    )
    .toEqual([
      'Native blocks',
      '[image]',
      'First paragraph',
      'Second paragraph',
    ]);
  expect(domNodeErrors).toEqual([]);
});
