import { createPlateEditor } from 'platejs/react';
import type { Value } from 'platejs';
import { describe, expect, it } from 'vitest';

import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { BaseGridColumnPlugin, BaseGridPlugin } from './grid-plugin';
import { findMatchingLayout, getGridLayouts } from './options';
import {
  applyGridLayout,
  createGrid,
  duplicateGridColumn,
  insertGridColumn,
  moveGridColumn,
  removeGridColumn,
  setGridColumnCount,
} from './transforms';

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const column = (id: string, size: number, ...blocks: object[]) => ({
  type: 'grid_column',
  id,
  size,
  children: blocks.length ? blocks : [p('')],
});
const grid = (...columns: object[]) => ({
  type: 'grid',
  id: 'g',
  theme: 'default',
  gap: 'm',
  stack: true,
  children: columns,
});

const createEditor = (
  value: object[],
  options: Record<string, unknown> = {},
) => {
  const editor = createPlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      BaseGridPlugin.configure({ options }),
      BaseGridColumnPlugin,
    ],
    value: structuredClone(value) as Value,
  });
  editor.tf.normalize({ force: true });
  return editor;
};

const columns = (editor: any) => editor.children[0].children;
const ids = (editor: any) => columns(editor).map((item: any) => item.id);
const sizes = (editor: any) => columns(editor).map((item: any) => item.size);
const texts = (editor: any) =>
  columns(editor).map((item: any) =>
    item.children.map((block: any) => block.children[0].text),
  );

describe('grid transforms', () => {
  it('creates a grid with 2 equal empty columns', () => {
    const value = createGrid();
    expect(value.children).toHaveLength(2);
    expect(value.children.map((item) => item.size)).toEqual([1, 1]);
    expect(value.children[0].children).toEqual([p('')]);
  });

  it('creates a grid from a layout, with blocks in its first column', () => {
    const value = createGrid({ layout: [2, 1, 1], blocks: [p('Hi') as any] });
    expect(value.children.map((item) => item.size)).toEqual([2, 1, 1]);
    expect(value.children[0].children).toEqual([p('Hi')]);
  });

  it('inserts an empty column with weight 1 at a position', () => {
    const editor = createEditor([grid(column('a', 2), column('b', 1))]);
    const at = insertGridColumn(editor, [0], 1, { select: true });
    expect(at).toEqual([0, 1]);
    expect(sizes(editor)).toEqual([2, 1, 1]);
    expect(ids(editor)[0]).toBe('a');
    expect(ids(editor)[2]).toBe('b');
    expect(editor.selection?.anchor.path).toEqual([0, 1, 0, 0]);
  });

  it('inserts no column beyond the maximum', () => {
    const editor = createEditor([grid(column('a', 1), column('b', 1))], {
      maxColumns: 2,
    });
    expect(insertGridColumn(editor, [0], 2)).toBeUndefined();
    expect(columns(editor)).toHaveLength(2);
  });

  it('removes a column but never the last one', () => {
    const editor = createEditor([
      grid(column('a', 1, p('A')), column('b', 1, p('B'))),
    ]);
    expect(removeGridColumn(editor, [0], 1)).toBe(true);
    expect(ids(editor)).toEqual(['a']);
    expect(editor.selection?.anchor.path).toEqual([0, 0, 0, 0]);
    expect(removeGridColumn(editor, [0], 0)).toBe(false);
  });

  it('duplicates a column with new IDs and the same weight', () => {
    const editor = createEditor([
      grid(column('a', 2, { ...p('A'), id: 'pa' }), column('b', 1)),
    ]);
    expect(duplicateGridColumn(editor, [0], 0)).toEqual([0, 1]);
    expect(sizes(editor)).toEqual([2, 2, 1]);
    const copy = columns(editor)[1];
    expect(copy.id).not.toBe('a');
    expect(copy.children[0].id).not.toBe('pa');
    expect(copy.children[0].children[0].text).toBe('A');
  });

  it('moves a column, which keeps its weight', () => {
    const editor = createEditor([
      grid(column('a', 2), column('b', 1), column('c', 1)),
    ]);
    expect(moveGridColumn(editor, [0], 0, 2)).toBe(true);
    expect(ids(editor)).toEqual(['b', 'c', 'a']);
    expect(sizes(editor)).toEqual([1, 1, 2]);
    expect(moveGridColumn(editor, [0], 0, 5)).toBe(false);
  });

  it('adds columns at the end and gives every column the same weight', () => {
    const editor = createEditor([grid(column('a', 2, p('A')), column('b', 1))]);
    expect(setGridColumnCount(editor, [0], 3)).toBe(true);
    expect(sizes(editor)).toEqual([1, 1, 1]);
    expect(ids(editor).slice(0, 2)).toEqual(['a', 'b']);
  });

  it('merges the blocks of removed columns into the last remaining one', () => {
    const editor = createEditor([
      grid(
        column('a', 1, p('A')),
        column('b', 1, p('B')),
        column('c', 1, p('C1'), p('C2')),
        column('d', 1),
      ),
    ]);
    expect(setGridColumnCount(editor, [0], 2)).toBe(true);
    expect(ids(editor)).toEqual(['a', 'b']);
    expect(texts(editor)).toEqual([['A'], ['B', 'C1', 'C2']]);
  });

  it('puts merged blocks in place of an empty paragraph', () => {
    const editor = createEditor([grid(column('a', 1), column('b', 1, p('B')))]);
    setGridColumnCount(editor, [0], 1);
    expect(texts(editor)).toEqual([['B']]);
  });

  it('keeps the count within 1 and the maximum', () => {
    const editor = createEditor([grid(column('a', 1))]);
    expect(setGridColumnCount(editor, [0], 0)).toBe(false);
    expect(setGridColumnCount(editor, [0], 5)).toBe(false);
  });

  it('applies a layout with one weight per column', () => {
    const editor = createEditor([grid(column('a', 1), column('b', 1))]);
    expect(applyGridLayout(editor, [0], [1, 2])).toBe(true);
    expect(sizes(editor)).toEqual([1, 2]);
    expect(applyGridLayout(editor, [0], [1, 1, 1])).toBe(false);
  });

  it('undoes a column count change in one step', () => {
    const editor = createEditor([
      grid(column('a', 2, p('A')), column('b', 1, p('B'))),
    ]);
    const before = structuredClone(editor.children);
    setGridColumnCount(editor, [0], 1);
    editor.undo();
    expect(editor.children).toEqual(before);
  });
});

describe('grid layouts', () => {
  it('offers the layouts for a column count', () => {
    const editor = createEditor([grid(column('a', 1))]);
    const options = editor.getOptions({ key: 'grid' }) as any;
    expect(getGridLayouts(options, 2)).toEqual([
      [1, 1],
      [2, 1],
      [1, 2],
    ]);
    expect(getGridLayouts(options, 4)).toEqual([[1, 1, 1, 1]]);
    expect(getGridLayouts(options, 5)).toEqual([]);
  });

  it('finds the layout that matches the column weights', () => {
    const layouts = [
      [1, 1],
      [2, 1],
      [1, 2],
    ];
    expect(findMatchingLayout([1, 2], layouts)).toBe(2);
    expect(findMatchingLayout([3, 1], layouts)).toBe(-1);
  });
});
