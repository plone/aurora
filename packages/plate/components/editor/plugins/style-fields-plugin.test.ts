import config from '@plone/registry';
import { createSlateEditor, createSlatePlugin, type Value } from 'platejs';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { BaseBasicBlocksKit } from './basic-blocks-base-kit';
import {
  BaseStyleFieldsPlugin,
  getElementStyleFields,
} from './style-fields-plugin';

/*
 * A native block with a `theme` style field, its own theme definitions,
 * and a slot that holds blocks: card › card_body › blocks.
 */

const themes = [
  { name: 'default', label: 'Default', style: {} },
  {
    name: 'sand',
    label: 'Sand',
    style: { '--theme-color': '#f5deb3', '--theme-foreground-color': '#000' },
  },
];

const cardSchema = () => ({
  title: 'Card',
  fieldsets: [{ id: 'default', title: 'Default', fields: ['theme', 'title'] }],
  properties: {
    theme: { title: 'Background', default: 'default', styleField: true },
    title: { title: 'Title' },
  },
  required: [],
});

const cardPlugins = (options: Record<string, unknown> = {}) => [
  createSlatePlugin({
    key: 'card',
    node: { isContainer: true, isElement: true },
    options: {
      schema: cardSchema,
      styleDefinitions: { theme: themes },
      container: {
        type: 'card',
        slot: 'card_body',
        allowedBlocks: ['p', 'card'],
        nestable: true,
        label: () => 'Card',
      },
      ...options,
    },
  }),
  createSlatePlugin({
    key: 'card_body',
    node: { isContainer: true, isElement: true },
  }),
];

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const card = (extra: Record<string, unknown>, ...blocks: object[]) => ({
  type: 'card',
  ...extra,
  children: [{ type: 'card_body', children: blocks }],
});

const createEditor = (value: object[], options = {}) => {
  const editor = createSlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      BaseStyleFieldsPlugin,
      ...cardPlugins(options),
    ],
    value: structuredClone(value) as Value,
  });
  editor.tf.normalize({ force: true });
  return editor;
};

// The registry's definitions, the fallback for blocks without their own.
const registryThemes = vi.fn((_args: Record<string, unknown>) => themes);

beforeAll(() => {
  config.registerUtility({
    type: 'styleFieldDefinition',
    name: 'theme',
    method: registryThemes as any,
  });
});

describe('style fields of native blocks', () => {
  it('resolves a style field from the block’s own definitions', () => {
    const editor = createEditor([card({ theme: 'sand' }, p('Hi'))]);
    const { style, values } = getElementStyleFields(
      editor,
      editor.children[0] as any,
    );
    expect(values).toEqual({ theme: 'sand' });
    expect(style).toEqual({
      '--theme-color': '#f5deb3',
      '--theme-foreground-color': '#000',
    });
  });

  it('applies the default of a style field, also to nested blocks', () => {
    const editor = createEditor([card({}, p('Outer'), card({}, p('Inner')))]);
    const outer = editor.children[0] as any;
    expect(outer.theme).toBe('default');
    expect(outer.children[0].children[1].theme).toBe('default');
  });

  it('replaces a value the definitions do not have with the default', () => {
    const editor = createEditor([card({ theme: 'unknown' }, p('Hi'))]);
    expect((editor.children[0] as any).theme).toBe('default');
  });

  it('falls back to the registry when the block has no own definitions', () => {
    const editor = createEditor([card({ theme: 'sand' }, p('Hi'))], {
      styleDefinitions: undefined,
    });
    registryThemes.mockClear();
    const { values } = getElementStyleFields(editor, editor.children[0] as any);
    expect(values).toEqual({ theme: 'sand' });
    expect(registryThemes).toHaveBeenCalled();
  });

  it('prefers the block’s own definitions to the registry', () => {
    const editor = createEditor([card({ theme: 'sand' }, p('Hi'))]);
    registryThemes.mockClear();
    getElementStyleFields(editor, editor.children[0] as any);
    expect(registryThemes).not.toHaveBeenCalled();
  });

  it('passes the data of the container to the definitions', () => {
    const editor = createEditor(
      [card({ id: 'outer' }, card({ theme: 'sand' }, p('Hi')))],
      { styleDefinitions: undefined },
    );
    const inner = (editor.children[0] as any).children[0].children[0];
    registryThemes.mockClear();
    getElementStyleFields(editor, inner);
    expect(registryThemes).toHaveBeenCalledWith(
      expect.objectContaining({
        container: expect.objectContaining({ id: 'outer' }),
      }),
    );
  });

  it('reads definitions from the plugin options with a function', () => {
    const editor = createEditor([card({ theme: 'night' }, p('Hi'))], {
      palette: [
        { name: 'night', label: 'Night', style: { '--theme-color': '#111' } },
      ],
      styleDefinitions: (options: any) => ({ theme: options.palette }),
    });
    const { style, values } = getElementStyleFields(
      editor,
      editor.children[0] as any,
    );
    expect(values).toEqual({ theme: 'night' });
    expect(style).toEqual({ '--theme-color': '#111' });
  });

  it('gives a schema function the plugin options', () => {
    const editor = createEditor([card({}, p('Hi'))], {
      fallback: 'sand',
      schema: ({ options }: any) => ({
        ...cardSchema(),
        properties: {
          theme: {
            title: 'Background',
            default: options.fallback,
            styleField: true,
          },
        },
      }),
    });
    expect((editor.children[0] as any).theme).toBe('sand');
  });

  it('leaves blocks without a settings schema alone', () => {
    const editor = createEditor([p('Plain')]);
    expect(getElementStyleFields(editor, editor.children[0] as any)).toEqual({
      style: {},
      values: {},
    });
  });
});
