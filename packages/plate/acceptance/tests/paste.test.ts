import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import {
  focusBlockStart,
  getValue,
  nodeText,
  pasteData,
  type EditorNode,
} from '../fixtures/editor';
import { DOCX_HTML, MARKDOWN_TEXT, WEB_HTML } from '../fixtures/clipboard';

/**
 * One line per top-level block, so expectations read like the pasted
 * document: `h2 Heading`, `disc/2 Nested item`, `table 2x2`, ...
 */
const outline = (nodes: EditorNode[]) =>
  nodes
    .filter((node) => !(node.type === 'p' && nodeText(node) === ''))
    .map((node) => {
      if (node.type === 'table') {
        const rows = node.children ?? [];
        return `table ${rows.length}x${rows[0]?.children?.length ?? 0}`;
      }
      if (node.listStyleType) {
        return `${node.listStyleType}/${node.indent} ${nodeText(node)}`;
      }
      return `${node.type} ${nodeText(node)}`;
    });

/** Marks and links of the first paragraph that contains a link. */
const inlineFormatting = (nodes: EditorNode[]) => {
  const paragraph = nodes.find((node) =>
    node.children?.some((child) => child.type === 'a'),
  );
  return {
    bold: paragraph?.children?.find((c) => c.bold)?.text,
    italic: paragraph?.children?.find((c) => c.italic)?.text,
    link: paragraph?.children?.find((c) => c.type === 'a')?.url,
  };
};

async function pasteIntoEmptyParagraph(
  page: Page,
  data: Record<string, string>,
) {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  await focusBlockStart(page, editorHandle, 1);

  await pasteData(page, editorHandle, data);

  // Wait until the paste has produced more than the title and a paragraph.
  await expect
    .poll(async () => (await getValue(page, editorHandle)).length)
    .toBeGreaterThan(3);
  return (await getValue(page, editorHandle)).slice(1);
}

test('Pasting from Word keeps headings, marks, links, lists and tables', async ({
  page,
}) => {
  const value = await pasteIntoEmptyParagraph(page, {
    'text/html': DOCX_HTML,
    'text/plain': 'Word content',
  });

  expect(outline(value)).toEqual([
    'h2 Word heading',
    'p Word paragraph with bold, italic and a Word link.',
    'disc/1 Word bullet one',
    'disc/2 Word bullet nested',
    'disc/1 Word bullet two',
    'decimal/1 Word number one',
    'decimal/1 Word number two',
    'table 2x2',
  ]);
  expect(inlineFormatting(value)).toEqual({
    bold: 'bold',
    italic: 'italic',
    link: 'https://plone.org',
  });
  // Word's markup and inline styles must not leak into the document.
  expect(JSON.stringify(value)).not.toMatch(/mso-|Mso|o:p/);
});

test('Pasting HTML from a web page keeps its structure', async ({ page }) => {
  const value = await pasteIntoEmptyParagraph(page, {
    'text/html': WEB_HTML,
    'text/plain': 'Web content',
  });

  expect(outline(value)).toEqual([
    'h2 Web heading',
    'p Web paragraph with bold, italic and a web link.',
    'disc/1 Web bullet one',
    'disc/1 Web bullet two',
    'decimal/1 Web number one',
    'decimal/1 Web number two',
    'blockquote Web quote',
    'code_block const web = true;',
    'table 2x2',
  ]);
  expect(inlineFormatting(value)).toEqual({
    bold: 'bold',
    italic: 'italic',
    link: 'https://plone.org',
  });
  // v53 blockquotes are containers of paragraphs.
  expect(value.find((n) => n.type === 'blockquote')?.children?.[0]?.type).toBe(
    'p',
  );
});

test('Pasting markdown as plain text converts it to blocks', async ({
  page,
}) => {
  const value = await pasteIntoEmptyParagraph(page, {
    'text/plain': MARKDOWN_TEXT,
  });

  expect(outline(value)).toEqual([
    'h2 Markdown heading',
    'p Markdown paragraph with bold, italic and a markdown link.',
    'disc/1 Markdown bullet one',
    'disc/1 Markdown bullet two',
    'decimal/1 Markdown number one',
    'decimal/1 Markdown number two',
    'blockquote Markdown quote',
    'code_block const markdown = true;',
    'table 2x2',
  ]);
  expect(inlineFormatting(value)).toEqual({
    bold: 'bold',
    italic: 'italic',
    link: 'https://plone.org',
  });
  expect(value.find((n) => n.type === 'code_block')?.lang).toBe('js');
  // The markdown table header row becomes header cells.
  expect(
    value.find((n) => n.type === 'table')?.children?.[0]?.children?.[0]?.type,
  ).toBe('th');
});

test('Pasting a plain URL does not run the markdown parser', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: 'See ' }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);
  await page.keyboard.press('Escape');
  await page
    .locator('[data-slate-editor]')
    .getByText('See', { exact: true })
    .click();
  await page.keyboard.press('End');

  await pasteData(page, editorHandle, { 'text/plain': 'https://plone.org' });

  await expect
    .poll(async () => (await getValue(page, editorHandle))[1])
    .toMatchObject({
      type: 'p',
      children: expect.arrayContaining([
        expect.objectContaining({ type: 'a', url: 'https://plone.org' }),
      ]),
    });
  // Still one paragraph: the URL was linked in place, not parsed as blocks.
  expect(
    (await getValue(page, editorHandle)).filter((n) => nodeText(n) !== ''),
  ).toHaveLength(2);
});

test('Pasting HTML with embedded media keeps only its text', async ({
  page,
}) => {
  // Aurora has no Plate media nodes; media are Plone blocks.
  const value = await pasteIntoEmptyParagraph(page, {
    'text/html': [
      '<h2>Media heading</h2>',
      '<p>Before the media.</p>',
      '<iframe src="https://www.youtube.com/embed/abc"></iframe>',
      '<video src="https://example.com/video.mp4" controls></video>',
      '<audio src="https://example.com/audio.mp3" controls></audio>',
      '<p>After the media.</p>',
    ].join(''),
    'text/plain': 'Media content',
  });

  expect(outline(value)).toEqual([
    'h2 Media heading',
    'p Before the media.',
    'p After the media.',
  ]);
});
