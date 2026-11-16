import config from '@plone/registry';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import {
  createSlateEditor,
  createSlatePlugin,
  createTSlatePlugin,
  type PluginConfig,
  type Value,
} from 'platejs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import {
  canInsertIn,
  getDefaultSlashMenuGroups,
  resolveSlashMenuGroups,
} from '../slash-menu';
import { getBlockConfig } from './block-config';
import { getAvailableInnerBlocks } from './inner-blocks';
import { enhanceInnerBlockSchema, withoutFields } from './inner-block-schema';
import { normalizeSlotBlocks } from './normalize-inner-blocks';
import {
  getBlockContainer,
  getBlockContainers,
  getContainerSpecs,
} from './registry';
import type { BlockContainerOption, BlockContainerSpec } from './types';

/*
 * A minimal container for the tests: box › box_body › blocks.
 */

type BoxOptions = { allowedBlocks: string[]; container?: BlockContainerOption };

const boxSpec =
  (overrides: Partial<BlockContainerSpec> = {}): BlockContainerOption =>
  (editor) => ({
    type: 'box',
    slot: 'box_body',
    allowedBlocks: (editor.getOptions({ key: 'box' }) as BoxOptions)
      .allowedBlocks,
    label: () => 'Box',
    nestingNote: () => "Boxes can't be placed inside a box.",
    ...overrides,
  });

const createBoxPlugins = (
  options: Partial<BoxOptions> = {},
  overrides: Partial<BlockContainerSpec> = {},
) => [
  createTSlatePlugin<PluginConfig<'box', BoxOptions>>({
    key: 'box',
    node: { isContainer: true, isElement: true },
    options: {
      allowedBlocks: ['p', 'h2', 'blockquote', 'image', 'box'],
      container: boxSpec(overrides),
      ...options,
    },
  }),
  createSlatePlugin({
    key: 'box_body',
    node: { isContainer: true, isElement: true },
  }).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
    transforms: {
      normalizeNode(entry, normalizeOptions) {
        const [node, path] = entry;
        if (
          (node as { type?: string }).type === 'box_body' &&
          normalizeSlotBlocks(editor, node as any, path)
        ) {
          return;
        }
        return normalizeNode(entry, normalizeOptions);
      },
    },
  })),
];

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const h2 = (text: string) => ({ type: 'h2', children: [{ text }] });
const box = (...blocks: object[]) => ({
  type: 'box',
  children: [{ type: 'box_body', children: blocks }],
});
const image = () => ({
  type: PLONE_BLOCK_TYPE,
  '@type': 'image',
  children: [{ text: '' }],
});

const createEditor = (
  value: object[],
  options: Partial<BoxOptions> = {},
  overrides: Partial<BlockContainerSpec> = {},
  plugins: any[] = [],
) =>
  createSlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      ...createBoxPlugins(options, overrides),
      ...plugins,
    ],
    value: structuredClone(value) as Value,
  });

const normalize = (
  value: object[],
  options: Partial<BoxOptions> = {},
  overrides: Partial<BlockContainerSpec> = {},
) => {
  const editor = createEditor(value, options, overrides);
  editor.tf.normalize({ force: true });
  return editor.children;
};

const blocks = config.blocks as Record<string, unknown>;
let blocksConfig: unknown;

beforeEach(() => {
  blocksConfig = blocks.blocksConfig;
});

afterEach(() => {
  blocks.blocksConfig = blocksConfig;
});

describe('container declarations', () => {
  it('reads the containers that plugins declare in their options', () => {
    const editor = createEditor([p('')]);
    expect(getContainerSpecs(editor).map((spec) => spec.type)).toEqual(['box']);
  });

  it('follows the plugin options when the declaration is a function', () => {
    const editor = createEditor([p('')], { allowedBlocks: ['p'] });
    expect(getContainerSpecs(editor)[0].allowedBlocks).toEqual(['p']);
  });

  it('finds no container outside of one', () => {
    const editor = createEditor([p(''), box(p('Inside'))]);
    expect(getBlockContainer(editor, [0])).toBeUndefined();
    expect(getBlockContainer(editor, [1])).toBeUndefined();
  });

  it('finds the container of a block, but not of the container itself', () => {
    const editor = createEditor([box(p('Inside'))]);
    const entry = getBlockContainer(editor, [0, 0, 0]);
    expect(entry?.spec.type).toBe('box');
    expect(entry?.container[1]).toEqual([0]);
    expect(entry?.slot[1]).toEqual([0, 0]);
    expect(getBlockContainer(editor, [0, 0])).toBeUndefined();
  });

  it('lists the containers around a block, from the closest one out', () => {
    const editor = createEditor([box(box(p('Deep')))], {}, { nestable: true });
    const entries = getBlockContainers(editor, [0, 0, 0, 0, 0]);
    expect(entries.map((entry) => entry.container[1])).toEqual([
      [0, 0, 0],
      [0],
    ]);
  });
});

describe('available inner blocks', () => {
  it('keeps the allowed blocks the editor has', () => {
    const editor = createEditor([box(p(''))], {
      allowedBlocks: ['p', 'h2', 'unknown_block'],
    });
    const [spec] = getContainerSpecs(editor);
    expect(getAvailableInnerBlocks(editor, spec)).toEqual(['p', 'h2']);
  });

  it('leaves out a container that can not be nested', () => {
    const editor = createEditor([box(p(''))]);
    const [spec] = getContainerSpecs(editor);
    expect(getAvailableInnerBlocks(editor, spec)).not.toContain('box');
    expect(
      getAvailableInnerBlocks(editor, { ...spec, nestable: true }),
    ).toContain('box');
  });

  it('leaves out the containers around the slot that can not be nested', () => {
    const editor = createEditor([box(p(''))]);
    const [spec] = getContainerSpecs(editor);
    const other = { ...spec, type: 'other', nestable: true };
    expect(getAvailableInnerBlocks(editor, other, [{ spec }])).not.toContain(
      'box',
    );
  });

  it('only offers Plone blocks with the Plone block adapter', () => {
    blocks.blocksConfig = { image: { id: 'image', title: 'Image' } };
    const editor = createEditor([box(p(''))]);
    const [spec] = getContainerSpecs(editor);
    expect(getAvailableInnerBlocks(editor, spec)).not.toContain('image');

    const withAdapter = createEditor([box(p(''))], {}, {}, [
      createSlatePlugin({
        key: PLONE_BLOCK_TYPE,
        node: { isElement: true, isVoid: true },
      }),
    ]);
    expect(
      getAvailableInnerBlocks(withAdapter, getContainerSpecs(withAdapter)[0]),
    ).toContain('image');
  });
});

describe('settings of the blocks inside a container', () => {
  const schema = () => ({
    title: 'Image',
    fieldsets: [
      { id: 'default', title: 'Default', fields: ['url', 'align', 'size'] },
    ],
    properties: { url: {}, align: {}, size: {} },
    required: ['size'],
  });

  const enhancers = {
    blocksConfig: {
      '*': {
        schemaEnhancer: (s: any) =>
          withoutFields(s, ['size'], 'No size in a box.'),
      },
      image: {
        schemaEnhancer: (s: any, { container }: any) => ({
          ...withoutFields(s, ['align'], 'No alignment in a box.'),
          title: `${s.title} in a ${container.type}`,
        }),
      },
    },
  };

  it('leaves the schema of a block outside a container as it is', () => {
    const editor = createEditor([image(), box(p(''))], {}, enhancers);
    expect(
      enhanceInnerBlockSchema(editor, [0], schema() as any, 'image'),
    ).toEqual(schema());
  });

  it('applies the enhancer for all blocks, then the one of the block', () => {
    const editor = createEditor([box(image())], {}, enhancers);
    const result = enhanceInnerBlockSchema(
      editor,
      [0, 0, 0],
      schema() as any,
      'image',
    );
    expect(result.fieldsets[0].fields).toEqual(['url']);
    expect(result.required).toEqual([]);
    expect(result.description).toBe('No alignment in a box.');
    expect(result.title).toBe('Image in a box');
  });

  it('resolves the config of a Plone block with the container overrides', () => {
    blocks.blocksConfig = {
      image: { id: 'image', title: 'Image', blockSchema: schema },
    };
    const editor = createEditor([image(), box(image())], {}, enhancers);

    const outside = getBlockConfig(editor, 'image', { at: [0] });
    expect(outside?.blockSchema).toBe(schema);

    const inside = getBlockConfig(editor, 'image', { at: [1, 0, 0] });
    const resolved = (inside?.blockSchema as any)({ formData: {} });
    expect(resolved.fieldsets[0].fields).toEqual(['url']);
    expect(inside?.title).toBe('Image');
  });

  it('returns the global config without a location', () => {
    blocks.blocksConfig = {
      image: { id: 'image', title: 'Image', blockSchema: schema },
    };
    const editor = createEditor([box(image())], {}, enhancers);
    expect(getBlockConfig(editor, 'image')?.blockSchema).toBe(schema);
    expect(getBlockConfig(editor, 'missing', { at: [0, 0, 0] })).toBe(
      undefined,
    );
  });
});

describe('normalization of the blocks inside a container', () => {
  it('keeps the blocks a container holds', () => {
    const value = [box(p('One'), h2('Two'))];
    expect(normalize(value)).toEqual(value);
  });

  it('gives an empty slot a paragraph', () => {
    expect(normalize([box()])).toEqual([box(p(''))]);
  });

  it('turns text blocks the container can not hold into paragraphs', () => {
    expect(normalize([box(h2('Title'))], { allowedBlocks: ['p'] })).toEqual([
      box(p('Title')),
    ]);
  });

  it('unwraps containers of blocks, leaving their blocks in place', () => {
    const quote = { type: 'blockquote', children: [p('A'), p('B')] };
    expect(normalize([box(quote)], { allowedBlocks: ['p'] })).toEqual([
      box(p('A'), p('B')),
    ]);
  });

  it('moves blocks it can not hold after the container, in order', () => {
    const unknownA = { type: 'unknown', children: [{ text: 'A' }] };
    const unknownB = { type: 'unknown', children: [{ text: 'B' }] };
    expect(normalize([box(p('Keep'), unknownA, unknownB)])).toEqual([
      box(p('Keep')),
      unknownA,
      unknownB,
    ]);
  });

  it('moves a nested container after its parent by default', () => {
    expect(normalize([box(p('Outer'), box(p('Inner')))])).toEqual([
      box(p('Outer')),
      box(p('Inner')),
    ]);
  });

  it('unwraps a nested container that asks for it', () => {
    expect(
      normalize(
        [box(p('Outer'), box(p('Inner')))],
        {},
        {
          whenDisallowed: 'unwrap',
        },
      ),
    ).toEqual([box(p('Outer'), p('Inner'))]);
  });
});

describe('slash menu inside a container', () => {
  const values = (groups: { items: { value: string }[] }[]) =>
    groups.flatMap((group) => group.items).map((item) => item.value);

  it('does not offer a container inside itself', () => {
    const editor = createEditor([box(p(''))]);
    expect(canInsertIn(editor, 'box', { type: 'box' })).toBe(false);
    expect(canInsertIn(editor, 'box', undefined)).toBe(true);
    expect(canInsertIn(editor, 'p', { type: 'box' })).toBe(true);
  });

  it('offers a nestable container inside itself', () => {
    const editor = createEditor([box(p(''))], {}, { nestable: true });
    expect(canInsertIn(editor, 'box', { type: 'box' })).toBe(true);
  });

  it('only keeps the blocks the container can hold', () => {
    const editor = createEditor([box(p(''))]) as any;
    const all = values(
      getDefaultSlashMenuGroups(editor, { hasTitleBlock: true }),
    );
    expect(all).toContain('h3');

    const inside = values(
      resolveSlashMenuGroups(editor, undefined, {
        hasTitleBlock: true,
        container: { type: 'box', availableBlocks: ['p', 'h2'] },
      }),
    );
    expect(inside).toContain('h2');
    expect(inside).not.toContain('h3');
  });
});
