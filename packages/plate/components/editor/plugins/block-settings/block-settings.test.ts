import { createSlatePlugin, PathApi, type TElement, type Value } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import type { BlockContainerSpec } from '../containers/types';
import {
  BlockSettingsPlugin,
  handleSettingsEscape,
} from './block-settings-plugin';
import {
  getSettingsEntry,
  getSettingsLevels,
  getSettingsTarget,
  setSettingsTarget,
} from './target';
import type { NodeSettingsDeclaration } from './types';

/*
 * A container for the tests: box › box_body › blocks. The box is a level;
 * its body has no settings. A caret in the box's caption implies the box.
 */

const spec: BlockContainerSpec = {
  type: 'box',
  slot: 'box_body',
  allowedBlocks: ['p'],
  label: () => 'Box',
};

const boxSettings: NodeSettingsDeclaration = {
  label: (_t, node) => `Box ${String(node.id)}`,
  fromSelection: (editor) => {
    const caption = editor.api.above({ match: { type: 'box_caption' } });
    return caption
      ? editor.api.node<TElement>(PathApi.parent(caption[1]))
      : undefined;
  },
};

const createEditor = (value: object[]) =>
  createPlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      BlockSettingsPlugin,
      createSlatePlugin({
        key: 'box',
        node: { isContainer: true, isElement: true },
        options: { container: spec, settings: boxSettings },
      }),
      createSlatePlugin({ key: 'box_caption', node: { isElement: true } }),
      createSlatePlugin({
        key: 'box_body',
        node: { isContainer: true, isElement: true },
      }),
    ],
    value: structuredClone(value) as Value,
  });

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const box = (id: string, ...blocks: object[]) => ({
  type: 'box',
  id,
  children: [
    { type: 'box_caption', children: [{ text: 'Caption' }] },
    { type: 'box_body', children: blocks },
  ],
});

describe('selection levels', () => {
  it('lists the levels above a block, from the outermost one in', () => {
    const editor = createEditor([p('Before'), box('one', p('Inside'))]);
    const levels = getSettingsLevels(editor, [1, 1, 0]);
    expect(levels.map((level) => [level.type, level.id, level.label])).toEqual([
      ['box', 'one', 'Box one'],
    ]);
    expect(getSettingsLevels(editor, [0])).toEqual([]);
  });

  it('counts the node itself with includeSelf', () => {
    const editor = createEditor([box('one', p('Inside'))]);
    expect(getSettingsLevels(editor, [0])).toEqual([]);
    expect(
      getSettingsLevels(editor, [0], { includeSelf: true }).map(
        (level) => level.id,
      ),
    ).toEqual(['one']);
  });

  it('implies a level from the selection when no target is chosen', () => {
    const editor = createEditor([box('one', p('Inside'))]);
    editor.tf.select(editor.api.start([0, 0]));
    expect(getSettingsEntry(editor)?.[1]).toEqual([0]);

    editor.tf.select(editor.api.start([0, 1, 0]));
    expect(getSettingsEntry(editor)).toBeUndefined();
  });

  it('prefers the chosen target', () => {
    const editor = createEditor([box('one', p('A')), box('two', p('B'))]);
    editor.tf.select(editor.api.start([0, 0]));
    setSettingsTarget(editor, { type: 'box', id: 'two' });
    expect(getSettingsEntry(editor)?.[1]).toEqual([1]);
  });
});

describe('Esc', () => {
  it('goes from a block to its level, the page, then nothing', () => {
    const editor = createEditor([box('one', p('Inside'))]);
    editor.tf.select(editor.api.start([0, 1, 0]));

    // Without block selection, the block's level is selected right away.
    expect(handleSettingsEscape(editor)).toBe(true);
    expect(getSettingsTarget(editor)).toEqual({ type: 'box', id: 'one' });

    expect(handleSettingsEscape(editor)).toBe(true);
    expect(getSettingsTarget(editor)).toEqual({ type: 'page' });

    expect(handleSettingsEscape(editor)).toBe(true);
    expect(getSettingsTarget(editor)).toBeNull();
  });

  it('goes up from an implied level', () => {
    const editor = createEditor([box('one', p('Inside'))]);
    editor.tf.select(editor.api.start([0, 0]));
    expect(handleSettingsEscape(editor)).toBe(true);
    expect(getSettingsTarget(editor)).toEqual({ type: 'page' });
  });

  it('leaves Esc alone outside any level', () => {
    const editor = createEditor([p('Outside')]);
    editor.tf.select(editor.api.start([0]));
    expect(handleSettingsEscape(editor)).toBe(false);
    expect(getSettingsTarget(editor)).toBeNull();
  });
});
