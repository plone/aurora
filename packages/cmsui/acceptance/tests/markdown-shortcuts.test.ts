import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import { clickAtPath, getEditorHandle } from '@platejs/playwright';

type Page = Parameters<typeof test>[0]['page'];
type EditorNode = {
  type?: string;
  text?: string;
  url?: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  listStyleType?: string;
  children?: EditorNode[];
};

// Markdown shortcuts are Plate `inputRules` configured on each feature kit
// (v53+), and text substitutions live in `AutoformatKit`. They trigger on
// real keystrokes, so the tests type character by character.
async function openEmptyParagraph(page: Page) {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const pageId = `markdown-shortcuts-${suffix}`;

  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: pageId,
    contentTitle: 'Markdown shortcuts',
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: 'Markdown shortcuts' }] },
            { type: 'p', children: [{ text: '' }] },
          ],
        },
      },
    }),
  });

  await page.goto(`/@@edit/${pageId}`);
  await waitForPlateEditorReady(page);

  const editorHandle = await getEditorHandle(page);
  await clickAtPath(page, editorHandle, [1]);

  return editorHandle;
}

async function getBlock(
  page: Page,
  editorHandle: Awaited<ReturnType<typeof getEditorHandle>>,
  index = 1,
) {
  return (await page.evaluate(
    ([editor, i]) => JSON.parse(JSON.stringify(editor.children[i])),
    [editorHandle, index] as const,
  )) as EditorNode;
}

test('Typing "## " turns the paragraph into an h2', async ({ page }) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('## Heading');

  await expect
    .poll(async () => (await getBlock(page, editorHandle)).type)
    .toBe('h2');
  expect((await getBlock(page, editorHandle)).children?.[0]?.text).toBe(
    'Heading',
  );
});

test('Typing "# " does not create an h1, which is reserved for the title', async ({
  page,
}) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('# Not a heading');

  await expect
    .poll(async () => (await getBlock(page, editorHandle)).children?.[0]?.text)
    .toBe('# Not a heading');
  expect((await getBlock(page, editorHandle)).type).toBe('p');
});

test('Typing "- " and "1. " start bulleted and numbered lists', async ({
  page,
}) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('- bullet');

  await expect
    .poll(async () => (await getBlock(page, editorHandle)).listStyleType)
    .toBe('disc');

  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('1. ordered');

  await expect
    .poll(async () => (await getBlock(page, editorHandle, 2)).listStyleType)
    .toBe('decimal');
});

test('Typing "> " wraps the paragraph in a blockquote container', async ({
  page,
}) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('> quoted');

  await expect
    .poll(async () => (await getBlock(page, editorHandle)).type)
    .toBe('blockquote');
  const blockquote = await getBlock(page, editorHandle);
  expect(blockquote.children).toEqual([
    expect.objectContaining({ type: 'p', children: [{ text: 'quoted' }] }),
  ]);
});

test('Typing "```" turns the paragraph into a code block', async ({ page }) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('```');

  await expect
    .poll(async () => (await getBlock(page, editorHandle)).type)
    .toBe('code_block');
});

test('Typing "---" inserts a horizontal rule', async ({ page }) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('---');

  await expect
    .poll(async () => (await getBlock(page, editorHandle)).type)
    .toBe('hr');
});

test('Inline markdown marks are applied while typing', async ({ page }) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('**bold** *italic* `code` ');

  await expect
    .poll(async () => (await getBlock(page, editorHandle)).children)
    .toEqual([
      { text: 'bold', bold: true },
      { text: ' ' },
      { text: 'italic', italic: true },
      { text: ' ' },
      { text: 'code', code: true },
      { text: ' ' },
    ]);
});

test('Text substitutions are applied while typing', async ({ page }) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('a -> b (c) 1/2 x -- y ...');

  await expect
    .poll(async () => (await getBlock(page, editorHandle)).children?.[0]?.text)
    .toBe('a → b © ½ x — y …');
});

test('Typing a URL followed by a space autolinks it', async ({ page }) => {
  const editorHandle = await openEmptyParagraph(page);
  await page.keyboard.type('see https://plone.org ');

  await expect
    .poll(async () =>
      (await getBlock(page, editorHandle)).children?.find(
        (child) => child.type === 'a',
      ),
    )
    .toMatchObject({
      type: 'a',
      url: 'https://plone.org',
      children: [{ text: 'https://plone.org' }],
    });
});
