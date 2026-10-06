import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import {
  focusBlockStart,
  getValue,
  insertWithSlashMenu,
  nodeText,
  type EditorNode,
} from '../fixtures/editor';

type SlashCase = {
  label: string;
  expect: (block: EditorNode) => void;
};

// Every native block offered by the slash menu of Aurora's editor preset.
const cases: SlashCase[] = [
  { label: 'Heading 2', expect: (b) => expect(b.type).toBe('h2') },
  { label: 'Heading 3', expect: (b) => expect(b.type).toBe('h3') },
  { label: 'Heading 4', expect: (b) => expect(b.type).toBe('h4') },
  { label: 'Heading 5', expect: (b) => expect(b.type).toBe('h5') },
  { label: 'Heading 6', expect: (b) => expect(b.type).toBe('h6') },
  {
    label: 'Bulleted list',
    expect: (b) => expect(b.listStyleType).toBe('disc'),
  },
  {
    label: 'Numbered list',
    expect: (b) => expect(b.listStyleType).toBe('decimal'),
  },
  {
    label: 'To-do list',
    expect: (b) => expect(b.listStyleType).toBe('todo'),
  },
  { label: 'Toggle', expect: (b) => expect(b.type).toBe('toggle') },
  { label: 'Code Block', expect: (b) => expect(b.type).toBe('code_block') },
  {
    label: 'Table',
    expect: (b) => {
      expect(b.type).toBe('table');
      expect(b.children?.length).toBeGreaterThan(0);
    },
  },
  {
    label: 'Blockquote',
    expect: (b) => {
      expect(b.type).toBe('blockquote');
      expect(b.children?.[0]?.type).toBe('p');
    },
  },
  { label: 'Callout', expect: (b) => expect(b.type).toBe('callout') },
  { label: 'Table of contents', expect: (b) => expect(b.type).toBe('toc') },
  {
    label: '3 columns',
    expect: (b) => {
      expect(b.type).toBe('column_group');
      expect(b.children).toHaveLength(3);
    },
  },
];

for (const { label, expect: expectBlock } of cases) {
  test(`Slash menu inserts "${label}"`, async ({ page }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, [], {
      extra: [{ type: 'p', children: [{ text: '' }] }],
    });
    await openInEditor(page, pageId);
    const editorHandle = await getEditorHandle(page);

    await insertWithSlashMenu(page, editorHandle, 1, label);

    // Most blocks replace the empty paragraph; tables and columns are
    // inserted after it. Check the first block that isn't an empty paragraph.
    const findInserted = async () =>
      (await getValue(page, editorHandle))
        .slice(1)
        .find(
          (node) =>
            node.type !== 'p' || !!node.listStyleType || nodeText(node) !== '',
        );
    await expect.poll(findInserted).toBeTruthy();
    expectBlock((await findInserted())!);

    // The slash trigger text never ends up in the document.
    expect(JSON.stringify(await getValue(page, editorHandle))).not.toContain(
      '"text":"/',
    );
  });
}

test('Slash menu does not offer AI actions in the Aurora preset', async ({
  page,
}) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  await focusBlockStart(page, editorHandle, 1);
  await page.keyboard.type('/');

  await expect(
    page.getByRole('option', { name: 'Heading 2', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('option', { name: 'AI' })).toHaveCount(0);
});

for (const label of ['Image', 'Teaser', 'Listing']) {
  test(`Slash menu keeps the selection on an inserted "${label}" block`, async ({
    page,
  }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, [], {
      extra: [{ type: 'p', children: [{ text: '' }] }],
    });
    await openInEditor(page, pageId);
    const editorHandle = await getEditorHandle(page);

    await insertWithSlashMenu(page, editorHandle, 1, label);
    await expect
      .poll(async () => (await getValue(page, editorHandle))[1]?.type)
      .toBe('ploneBlock');

    // The caret used to stay at the start of the title: the block's lazy
    // Edit component kept the element out of the DOM when the editor was
    // refocused, and a non-editable element could not hold the caret anyway.
    const inserted = page.locator('[data-slate-editor] > *').nth(1);
    await expect(inserted).toHaveAttribute('data-slate-void', 'true');
    await expect
      .poll(() =>
        inserted.evaluate((block) => {
          const anchor = window.getSelection()?.anchorNode;
          return (
            !!anchor &&
            block.contains(anchor) &&
            block.closest('[data-slate-editor]') === document.activeElement
          );
        }),
      )
      .toBe(true);
    expect(
      await editorHandle.evaluate(
        (editor: any) => editor.selection?.anchor.path[0] ?? null,
      ),
    ).toBe(1);
  });
}
