import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { getEditorHandle } from '@platejs/playwright';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';

import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  openInView,
  savePage,
} from '../fixtures/pages';
import {
  focusBlockStart,
  getValue,
  insertWithSlashMenu,
  pasteData,
  type EditorHandle,
  type EditorNode,
} from '../fixtures/editor';

// The width of a top-level block is stored in the document, the default one
// too. A width the editor only adds when a page is loaded would show up as a
// change between two versions of the page that nobody made.

const topLevelWidths = (value: EditorNode[]) =>
  value.map((node) => [node.type, node.blockWidth]);

const emptyParagraph = { type: 'p', children: [{ text: '' }] };

/**
 * Saves the page and checks that what is stored has a width on every
 * top-level block and loads back into the editor unchanged.
 */
async function saveAndExpectStableWidths(page: Page, pageId: string) {
  await savePage(page);
  const stored = (await getStoredValue(page, pageId)) as EditorNode[];

  for (const node of stored) {
    expect(typeof node.blockWidth, `width of "${node.type}"`).toBe('string');
  }

  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  expect(topLevelWidths(await getValue(page, editorHandle))).toEqual(
    topLevelWidths(stored),
  );

  return stored;
}

async function setWidthAt(
  page: Page,
  editorHandle: EditorHandle,
  index: number,
  width: string,
) {
  // The transform the block width toolbar button calls.
  await page.evaluate(
    ([editor, at, value]: [any, number, string]) =>
      editor.tf.blockWidth.setWidth(value, { at: [at] }),
    [editorHandle, index, width] as [any, number, string],
  );
}

/** The `--block-width` the renderer sets on the block holding `locator`. */
async function renderedBlockWidth(locator: Locator) {
  return locator.evaluate((element) =>
    (
      element.closest('[style*="--block-width"]') as HTMLElement | null
    )?.style.getPropertyValue('--block-width'),
  );
}

test.describe('Native blocks', () => {
  for (const label of [
    'Heading 2',
    'Blockquote',
    'Callout',
    'Code Block',
    'Table',
    'Toggle',
    'Table of contents',
    '3 columns',
  ]) {
    test(`"${label}" from the slash menu stores its default width`, async ({
      page,
    }) => {
      await login(page);
      const pageId = await createNativeBlocksPage(page, [], {
        extra: [emptyParagraph],
      });
      await openInEditor(page, pageId);
      const editorHandle = await getEditorHandle(page);

      await insertWithSlashMenu(page, editorHandle, 1, label);
      await expect
        .poll(async () =>
          (await getValue(page, editorHandle)).some(
            (node) => node.type !== 'p' && node.type !== 'title',
          ),
        )
        .toBe(true);

      await saveAndExpectStableWidths(page, pageId);
    });
  }

  test('Typed and pasted blocks store their default width', async ({
    page,
  }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, [], {
      extra: [emptyParagraph],
    });
    await openInEditor(page, pageId);
    const editorHandle = await getEditorHandle(page);

    await focusBlockStart(page, editorHandle, 1);
    await page.keyboard.type('## Typed heading');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Typed paragraph');
    await page.keyboard.press('Enter');
    // `hr` has no entry in `plateBlocksConfig`: it gets the global default.
    await pasteData(page, editorHandle, {
      'text/html':
        '<h3>Pasted heading</h3><p>Pasted paragraph</p><hr><blockquote>Pasted quote</blockquote>',
    });
    await expect
      .poll(async () =>
        (await getValue(page, editorHandle)).map((node) => node.type),
      )
      .toEqual(expect.arrayContaining(['h2', 'h3', 'hr', 'blockquote']));

    const stored = await saveAndExpectStableWidths(page, pageId);

    expect(stored.find((node) => node.type === 'h2')?.blockWidth).toBe(
      'narrow',
    );
    expect(stored.find((node) => node.type === 'hr')?.blockWidth).toBe(
      'default',
    );
  });

  test('Blocks stored without a width get it on the first save', async ({
    page,
  }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, [
      'headings',
      'blockquote',
      'callout',
      'hr',
    ]);
    await openInEditor(page, pageId);

    await saveAndExpectStableWidths(page, pageId);
  });

  test('A non-default width is stored, kept and rendered', async ({ page }) => {
    await login(page);
    // `toc` is the native block that offers more than one width.
    const pageId = await createNativeBlocksPage(page, [], {
      extra: [
        { type: 'toc', blockWidth: 'layout', children: [{ text: '' }] },
        { type: 'h2', children: [{ text: 'First section' }] },
      ],
    });
    await openInEditor(page, pageId);
    let editorHandle = await getEditorHandle(page);

    // Editing something else keeps the stored width.
    await focusBlockStart(page, editorHandle, 2);
    await page.keyboard.type('Edited ');
    let stored = await saveAndExpectStableWidths(page, pageId);
    expect(stored[1]).toMatchObject({ type: 'toc', blockWidth: 'layout' });

    editorHandle = await getEditorHandle(page);
    await setWidthAt(page, editorHandle, 1, 'narrow');
    stored = await saveAndExpectStableWidths(page, pageId);
    expect(stored[1]).toMatchObject({ type: 'toc', blockWidth: 'narrow' });

    await openInView(page, pageId);
    expect(await renderedBlockWidth(page.locator('.slate-toc').first())).toBe(
      'var(--narrow-container-width)',
    );
  });
});

test.describe('Plone blocks', () => {
  async function createImagePage(page: Page, imageBlock = {}) {
    await createContent(page, {
      contentType: 'Image',
      contentId: 'width-image',
      contentTitle: 'Width image',
      image: {
        sourceFilename: 'halfdome2022.jpg',
        filename: 'halfdome2022.jpg',
        'content-type': 'image/jpeg',
      },
    });

    return createNativeBlocksPage(page, [], {
      extra: [
        { type: 'p', children: [{ text: 'Text before the image' }] },
        {
          type: PLONE_BLOCK_TYPE,
          '@type': 'image',
          url: '/width-image',
          align: 'center',
          size: 'l',
          ...imageBlock,
          children: [{ text: '' }],
        },
      ],
    });
  }

  const image = (page: Page) =>
    page.locator('img[src*="/width-image/@@images/image"]').first();

  test('Image from the slash menu stores its default width', async ({
    page,
  }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, [], {
      extra: [emptyParagraph],
    });
    await openInEditor(page, pageId);
    const editorHandle = await getEditorHandle(page);

    await insertWithSlashMenu(page, editorHandle, 1, 'Image');
    await expect
      .poll(async () =>
        (await getValue(page, editorHandle)).some(
          (node) => node.type === PLONE_BLOCK_TYPE,
        ),
      )
      .toBe(true);

    const stored = await saveAndExpectStableWidths(page, pageId);

    expect(
      stored.find((node) => node.type === PLONE_BLOCK_TYPE)?.blockWidth,
    ).toBe('default');
  });

  test('Image stored without a width gets it on the first save', async ({
    page,
  }) => {
    await login(page);
    const pageId = await createImagePage(page);
    await openInEditor(page, pageId);

    const stored = await saveAndExpectStableWidths(page, pageId);

    expect(stored[2]).toMatchObject({
      type: PLONE_BLOCK_TYPE,
      blockWidth: 'default',
    });
  });

  test('A non-default image width is stored, kept and rendered', async ({
    page,
  }) => {
    await login(page);
    const pageId = await createImagePage(page, { blockWidth: 'default' });
    await openInEditor(page, pageId);

    const form = page.locator('#sidebar form');
    await expect(async () => {
      if ((await form.count()) === 0) await image(page).click();
      await page
        .getByRole('radio', { name: 'Layout', exact: true })
        .click({ force: true, timeout: 2_000 });
    }).toPass();
    const editorHandle = await getEditorHandle(page);
    await expect
      .poll(async () => (await getValue(page, editorHandle))[2]?.blockWidth)
      .toBe('layout');

    const stored = await saveAndExpectStableWidths(page, pageId);
    expect(stored[2]).toMatchObject({
      type: PLONE_BLOCK_TYPE,
      blockWidth: 'layout',
    });

    await openInView(page, pageId);
    await expect(image(page)).toBeVisible();
    expect(await renderedBlockWidth(image(page))).toBe(
      'var(--layout-container-width)',
    );
  });
});
