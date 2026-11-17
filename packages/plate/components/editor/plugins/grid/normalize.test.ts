import { createSlateEditor, type Value } from 'platejs';
import { describe, expect, it } from 'vitest';

import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { BaseGridColumnPlugin, BaseGridPlugin } from './grid-plugin';

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const h2 = (text: string) => ({ type: 'h2', children: [{ text }] });
const column = (id: string, size: number, ...blocks: object[]) => ({
  type: 'grid_column',
  id,
  size,
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

const normalize = (value: object[], options: Record<string, unknown> = {}) => {
  const editor = createSlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      BaseGridPlugin.configure({ options }),
      BaseGridColumnPlugin,
    ],
    value: structuredClone(value) as Value,
  });
  editor.tf.normalize({ force: true });
  return editor.children as any[];
};

describe('grid normalization', () => {
  it('keeps a valid grid as it is', () => {
    const value = [grid(column('a', 2, p('One')), column('b', 1, h2('Two')))];
    expect(normalize(value)).toEqual(value);
  });

  it('keeps a grid with one column', () => {
    const value = [grid(column('a', 1, p('Only')))];
    expect(normalize(value)).toEqual(value);
  });

  it('fills in the grid defaults', () => {
    const [result] = normalize([
      { type: 'grid', children: [column('a', 1, p('One'))] },
    ]);
    expect(result).toMatchObject({
      type: 'grid',
      theme: 'default',
      gap: 'm',
      stack: true,
    });
    expect(typeof result.id).toBe('string');
  });

  it('replaces a gap or a theme it does not know', () => {
    const [result] = normalize([
      { ...grid(column('a', 1, p(''))), gap: 'xl', theme: 'neon' },
    ]);
    expect(result.gap).toBe('m');
    expect(result.theme).toBe('default');
  });

  it('keeps a theme of the configured themes', () => {
    const themes = [
      { name: 'sand', label: 'Sand', style: { '--theme-color': 'wheat' } },
    ];
    const [result] = normalize(
      [{ ...grid(column('a', 1, p(''))), theme: 'grey' }],
      { themes },
    );
    expect(result.theme).toBe('sand');
  });

  it('gives a grid without columns one with an empty paragraph', () => {
    const [result] = normalize([grid()]);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toMatchObject({
      type: 'grid_column',
      size: 1,
      children: [p('')],
    });
  });

  it('gives an empty column an empty paragraph', () => {
    const [result] = normalize([grid(column('a', 1))]);
    expect(result.children[0].children).toEqual([p('')]);
  });

  it('makes sizes positive integers', () => {
    const [result] = normalize([
      grid(column('a', 2.6, p('A')), column('b', 0, p('B')), {
        ...column('c', 1, p('C')),
        size: 'wide',
      }),
    ]);
    expect(result.children.map((item: any) => item.size)).toEqual([3, 1, 1]);
  });

  it('wraps content that is not a column, joining the column before it', () => {
    const [result] = normalize([
      grid(p('Loose'), column('a', 1, p('A')), p('After A'), h2('Also')),
    ]);
    expect(result.children).toHaveLength(2);
    expect(result.children[0].children).toEqual([p('Loose')]);
    expect(result.children[1].children).toEqual([
      p('A'),
      p('After A'),
      h2('Also'),
    ]);
  });

  it('merges columns beyond the maximum into the last one allowed', () => {
    const [result] = normalize(
      [
        grid(
          column('a', 1, p('A')),
          column('b', 1, p('B')),
          column('c', 1, p('C')),
        ),
      ],
      { maxColumns: 2 },
    );
    expect(result.children.map((item: any) => item.id)).toEqual(['a', 'b']);
    expect(result.children[1].children).toEqual([p('B'), p('C')]);
  });

  it('never rebalances the column sizes', () => {
    const value = [grid(column('a', 3, p('A')), column('b', 1, p('B')))];
    expect(normalize(value)[0].children.map((item: any) => item.size)).toEqual([
      3, 1,
    ]);
  });

  it('unwraps a grid inside a column into its blocks', () => {
    const inner = grid(
      column('x', 1, p('Inner 1')),
      column('y', 1, p('Inner 2')),
    );
    const [result] = normalize([grid(column('a', 1, p('Outer'), inner))]);
    expect(result.children).toHaveLength(1);
    expect(result.children[0].children).toEqual([
      p('Outer'),
      p('Inner 1'),
      p('Inner 2'),
    ]);
  });

  it('turns text blocks a column can not hold into paragraphs', () => {
    const [result] = normalize([grid(column('a', 1, h2('Title')))], {
      allowedBlocks: ['p'],
    });
    expect(result.children[0].children).toEqual([p('Title')]);
  });

  it('unwraps a column found outside a grid', () => {
    expect(normalize([column('a', 1, p('Stray'))])).toEqual([p('Stray')]);
  });
});
