import { createPlateEditor } from 'platejs/react';
import type { Value } from 'platejs';
import { describe, expect, it } from 'vitest';

import { AccordionKit } from '../accordion/accordion-kit';
import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import {
  getDefaultSlashMenuGroups,
  resolveSlashMenuGroups,
} from '../slash-menu';
import { TitleBlock } from '../title';
import { insertGrid, turnIntoGrid } from './editor-transforms';
import { handleGridKeyDown } from './grid-editor-plugin';
import { GridKit } from './grid-kit';

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const column = (id: string, ...blocks: object[]) => ({
  type: 'grid_column',
  id,
  size: 1,
  children: blocks,
});
const grid = (...columns: object[]) => ({
  type: 'grid',
  id: 'g',
  theme: 'default',
  gap: 'm',
  stack: true,
  children: columns,
});

const createEditor = (value: object[], plugins: any[] = []) => {
  const editor = createPlateEditor({
    plugins: [...BaseBasicBlocksKit, ...GridKit, ...plugins],
    value: structuredClone(value) as Value,
  });
  editor.tf.normalize({ force: true });
  return editor;
};

const key = (keyName: string, extra: Record<string, boolean> = {}) => {
  const event = {
    key: keyName,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
    ...extra,
  };
  return event;
};

describe('inserting a grid', () => {
  it('inserts a grid with 2 empty columns and the caret in the first', () => {
    const editor = createEditor([p('Before')]);
    editor.tf.select(editor.api.end([0]));
    insertGrid(editor);
    const inserted = editor.children[1] as any;
    expect(inserted.type).toBe('grid');
    expect(inserted.children).toHaveLength(2);
    expect(editor.selection?.anchor.path).toEqual([1, 0, 0, 0]);
  });

  it('turns the selected blocks into the first column of a 2-column grid', () => {
    const editor = createEditor([p('One'), p('Two'), p('Three')]);
    editor.tf.select({
      anchor: editor.api.start([0]),
      focus: editor.api.end([1]),
    });
    expect(turnIntoGrid(editor)).toBe(true);
    const [result, after] = editor.children as any[];
    expect(result.type).toBe('grid');
    expect(
      result.children[0].children.map((b: any) => b.children[0].text),
    ).toEqual(['One', 'Two']);
    expect(result.children[1].children).toEqual([p('')]);
    expect(after.children[0].text).toBe('Three');
  });

  it('never wraps the page title', () => {
    const editor = createEditor(
      [{ type: 'title', children: [{ text: 'Title' }] }, p('Body')],
      [TitleBlock],
    );
    editor.tf.select({
      anchor: editor.api.start([0]),
      focus: editor.api.end([1]),
    });
    turnIntoGrid(editor);
    expect((editor.children[0] as any).type).toBe('title');
    expect((editor.children[1] as any).type).toBe('grid');
  });

  it('does nothing inside a grid', () => {
    const editor = createEditor([grid(column('a', p('A')))]);
    editor.tf.select(editor.api.start([0, 0, 0]));
    expect(turnIntoGrid(editor)).toBe(false);
  });
});

describe('the keyboard in a grid', () => {
  it('never merges columns with Backspace or Delete', () => {
    const editor = createEditor([
      grid(column('a', p('A')), column('b', p('B'))),
    ]);
    editor.tf.select(editor.api.start([0, 1]));
    const backspace = key('Backspace');
    expect(handleGridKeyDown(editor, backspace)).toBe(true);
    expect(backspace.defaultPrevented).toBe(true);

    editor.tf.select(editor.api.end([0, 0]));
    expect(handleGridKeyDown(editor, key('Delete'))).toBe(true);
  });

  it('keeps Backspace inside a block', () => {
    const editor = createEditor([grid(column('a', p('AB')))]);
    editor.tf.select({ path: [0, 0, 0, 0], offset: 1 });
    expect(handleGridKeyDown(editor, key('Backspace'))).toBe(false);
  });

  it('moves between columns with the up and down arrows at their edges', () => {
    const editor = createEditor([
      grid(column('a', p('A')), column('b', p('B'))),
    ]);
    editor.tf.select(editor.api.end([0, 0]));
    expect(handleGridKeyDown(editor, key('ArrowDown'))).toBe(true);
    expect(editor.selection?.anchor.path).toEqual([0, 1, 0, 0]);

    expect(handleGridKeyDown(editor, key('ArrowUp'))).toBe(true);
    expect(editor.selection?.anchor).toEqual({ path: [0, 0, 0, 0], offset: 1 });

    // Past the last column, the caret leaves the grid as usual.
    editor.tf.select(editor.api.end([0, 1]));
    expect(handleGridKeyDown(editor, key('ArrowDown'))).toBe(false);
  });

  it('selects the column, then the grid, with Mod+A', () => {
    const editor = createEditor([
      grid(column('a', p('A1'), p('A2')), column('b', p('B'))),
      p('After'),
    ]);
    editor.tf.select({ path: [0, 0, 0, 0], offset: 1 });

    expect(handleGridKeyDown(editor, key('a', { ctrlKey: true }))).toBe(true);
    expect(editor.api.string(editor.selection!)).toBe('A1A2');

    expect(handleGridKeyDown(editor, key('a', { ctrlKey: true }))).toBe(true);
    expect(editor.selection?.focus.path).toEqual([0, 1, 0, 0]);

    // Then the document's own select all.
    expect(handleGridKeyDown(editor, key('a', { ctrlKey: true }))).toBe(false);
  });
});

describe('the slash menu and grids', () => {
  const values = (groups: { items: { value: string }[] }[]) =>
    groups.flatMap((group) => group.items).map((item) => item.value);

  it('offers the grid at the top level', () => {
    const editor = createEditor([p('')]) as any;
    expect(
      values(getDefaultSlashMenuGroups(editor, { hasTitleBlock: true })),
    ).toContain('grid');
  });

  it('does not offer the grid inside a grid', () => {
    const editor = createEditor([p('')]) as any;
    expect(
      values(
        resolveSlashMenuGroups(editor, undefined, {
          hasTitleBlock: true,
          container: { type: 'grid' },
        }),
      ),
    ).not.toContain('grid');
  });

  it('does not offer the grid inside an accordion', () => {
    const editor = createEditor([p('')], AccordionKit) as any;
    expect(
      values(
        resolveSlashMenuGroups(editor, undefined, {
          hasTitleBlock: true,
          container: {
            type: 'accordion',
            availableBlocks: ['p', 'table', 'hr'],
          },
        }),
      ),
    ).not.toContain('grid');
  });
});
