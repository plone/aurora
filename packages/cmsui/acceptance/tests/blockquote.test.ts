import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

type Page = Parameters<typeof test>[0]['page'];

// Plate v53 stores blockquotes as containers of blocks. Legacy flat
// blockquotes (text children, as written by volto-slate) are migrated on load
// by the somersault migration pipeline.
async function createBlockquotePage(
  page: Page,
  blockquote: unknown,
  { legacyVoltoBlocks = false } = {},
) {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const pageId = `blockquote-${suffix}`;

  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: pageId,
    contentTitle: 'Blockquote page',
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      ...(legacyVoltoBlocks
        ? {
            blocks: {
              title: { '@type': 'title' },
              quote: { '@type': 'slate', value: [blockquote] },
            },
            blocks_layout: { items: ['title', 'quote'] },
          }
        : {
            blocks: {
              __somersault__: {
                '@type': '__somersault__',
                value: [
                  { type: 'title', children: [{ text: 'Blockquote page' }] },
                  blockquote,
                ],
              },
            },
            blocks_layout: { items: ['__somersault__'] },
          }),
    }),
  });

  return pageId;
}

test('A legacy volto-slate blockquote is loaded as a blockquote container', async ({
  page,
}) => {
  const pageId = await createBlockquotePage(
    page,
    { type: 'blockquote', children: [{ text: 'Legacy quote' }] },
    { legacyVoltoBlocks: true },
  );

  await page.goto(`/@@edit/${pageId}`);
  await waitForPlateEditorReady(page);
  const editorHandle = await getEditorHandle(page);

  const blockquote = await page.evaluate(
    (editor) => JSON.parse(JSON.stringify(editor.children[1])),
    editorHandle,
  );

  expect(blockquote.type).toBe('blockquote');
  expect(blockquote.children).toEqual([
    expect.objectContaining({
      type: 'p',
      children: [{ text: 'Legacy quote' }],
    }),
  ]);
});

test('Paragraphs in a blockquote fill the quote in the public view', async ({
  page,
}) => {
  const pageId = await createBlockquotePage(page, {
    type: 'blockquote',
    children: [
      { type: 'p', children: [{ text: 'First quoted paragraph' }] },
      { type: 'p', children: [{ text: 'Second quoted paragraph' }] },
    ],
  });

  await page.goto(`/${pageId}`);
  const quoted = page.getByText('First quoted paragraph');
  await expect(quoted).toBeVisible();

  const { paragraphWidth, containerWidth } = await quoted.evaluate((node) => {
    const paragraph = node.closest('[data-slate-type="p"]')!;
    const container = paragraph.parentElement!;
    const styles = getComputedStyle(container);
    return {
      paragraphWidth: paragraph.getBoundingClientRect().width,
      containerWidth:
        container.clientWidth -
        parseFloat(styles.paddingLeft) -
        parseFloat(styles.paddingRight),
    };
  });

  expect(Math.round(paragraphWidth)).toBe(Math.round(containerWidth));
});
