import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import { createSlateEditor, createSlatePlugin, type Value } from 'platejs';

import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { BaseColumnKit } from '../column-base-kit';
import { BaseTableKit } from '../table-base-kit';
import { BaseAccordionKit } from './accordion-base-kit';
import { BaseAccordionPlugin } from './accordion-plugin';
import { getAvailableInnerBlocks } from './transforms';

const PloneBlockPlugin = createSlatePlugin({
  key: PLONE_BLOCK_TYPE,
  node: { isElement: true, isVoid: true },
});

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const title = (text: string) => ({
  type: 'accordion_panel_title',
  children: [{ text }],
});
const content = (...children: object[]) => ({
  type: 'accordion_panel_content',
  children,
});
const panel = (id: string, text: string, ...blocks: object[]) => ({
  type: 'accordion_panel',
  id,
  startOpen: false,
  anchor: '',
  children: [title(text), content(...(blocks.length ? blocks : [p('')]))],
});
const accordion = (...panels: object[]) => ({
  type: 'accordion',
  id: 'acc',
  exclusive: true,
  theme: 'white',
  children: panels,
});

const normalize = (value: object[], plugins: any[] = []) => {
  const editor = createSlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      ...BaseTableKit,
      ...BaseColumnKit,
      ...BaseAccordionKit,
      ...plugins,
    ],
    value: structuredClone(value) as Value,
  });
  editor.tf.normalize({ force: true });
  return editor;
};

const blocks = config.blocks as Record<string, unknown>;
let blocksConfig: unknown;

beforeEach(() => {
  blocksConfig = blocks.blocksConfig;
});

afterEach(() => {
  blocks.blocksConfig = blocksConfig;
});

describe('accordion normalization', () => {
  it('keeps a valid accordion as it is', () => {
    const value = [
      accordion(panel('a', 'First', p('One')), panel('b', 'Second')),
    ];
    expect(normalize(value).children).toEqual(value);
  });

  it('adds the missing fields with their defaults', () => {
    const editor = normalize([
      {
        type: 'accordion',
        children: [
          {
            type: 'accordion_panel',
            children: [title('Title'), content(p('Text'))],
          },
        ],
      },
    ]);
    const [node] = editor.children as any[];
    expect(node.id).toEqual(expect.any(String));
    expect(node.exclusive).toBe(true);
    expect(node.theme).toBe('white');
    expect(node.children[0]).toMatchObject({
      id: expect.any(String),
      startOpen: false,
      anchor: '',
    });
  });

  it('replaces an unknown theme with the first one', () => {
    const editor = normalize([{ ...accordion(panel('a', 'A')), theme: 'red' }]);
    expect((editor.children[0] as any).theme).toBe('white');
  });

  it('keeps a theme set in the plugin options', () => {
    const editor = normalize(
      [{ ...accordion(panel('a', 'A')), theme: 'sand' }],
      [
        BaseAccordionPlugin.configure({
          options: {
            themes: [{ id: 'sand', label: 'Sand', color: 'wheat' }],
          },
        }),
      ],
    );
    expect((editor.children[0] as any).theme).toBe('sand');
  });

  it('gives an empty accordion one empty panel', () => {
    const editor = normalize([
      { type: 'accordion', id: 'acc', children: [{ text: '' }] },
    ]);
    const [node] = editor.children as any[];
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toMatchObject({
      type: 'accordion_panel',
      children: [title(''), content(p(''))],
    });
  });

  it('puts blocks found between panels into a panel of their own', () => {
    const editor = normalize([
      accordion(panel('a', 'A'), p('Stray'), panel('b', 'B')),
    ]);
    const [node] = editor.children as any[];
    expect(node.children.map((child: any) => child.type)).toEqual([
      'accordion_panel',
      'accordion_panel',
      'accordion_panel',
    ]);
    expect(node.children[1].children[1]).toEqual(content(p('Stray')));
  });

  it('gives a panel its missing title and content', () => {
    const editor = normalize([
      accordion({
        type: 'accordion_panel',
        id: 'a',
        startOpen: false,
        anchor: '',
        children: [content(p('Body'))],
      }),
    ]);
    expect((editor.children[0] as any).children[0].children).toEqual([
      title(''),
      content(p('Body')),
    ]);

    const withoutContent = normalize([
      accordion({
        type: 'accordion_panel',
        id: 'a',
        startOpen: false,
        anchor: '',
        children: [title('Only a title')],
      }),
    ]);
    expect((withoutContent.children[0] as any).children[0].children).toEqual([
      title('Only a title'),
      content(p('')),
    ]);
  });

  it('moves extra panel children into its content, in order', () => {
    const editor = normalize([
      accordion({
        type: 'accordion_panel',
        id: 'a',
        startOpen: false,
        anchor: '',
        children: [title('A'), content(p('One')), p('Two'), p('Three')],
      }),
    ]);
    expect((editor.children[0] as any).children[0].children).toEqual([
      title('A'),
      content(p('One'), p('Two'), p('Three')),
    ]);
  });

  it('merges a second content into the first one', () => {
    const editor = normalize([
      accordion({
        type: 'accordion_panel',
        id: 'a',
        startOpen: false,
        anchor: '',
        children: [title('A'), content(p('One')), content(p('Two'))],
      }),
    ]);
    expect((editor.children[0] as any).children[0].children).toEqual([
      title('A'),
      content(p('One'), p('Two')),
    ]);
  });

  it('turns text blocks that a panel cannot hold into paragraphs', () => {
    const editor = normalize([
      accordion(
        panel(
          'a',
          'A',
          { type: 'h2', children: [{ text: 'Heading' }] },
          { type: 'blockquote', children: [{ text: 'Quote' }] },
        ),
      ),
    ]);
    expect(
      (editor.children[0] as any).children[0].children[1].children,
    ).toEqual([p('Heading'), p('Quote')]);
    expect(editor.children).toHaveLength(1);
  });

  it('moves an accordion inside a panel after the accordion', () => {
    const inner = {
      ...accordion(panel('x', 'Inner')),
      id: 'inner',
    };
    const editor = normalize([
      accordion(panel('a', 'A', p('Before'), inner, p('After'))),
      p('Next'),
    ]);
    const children = editor.children as any[];
    expect(children.map((child) => child.type)).toEqual([
      'accordion',
      'accordion',
      'p',
    ]);
    expect(children[0].children[0].children[1]).toEqual(
      content(p('Before'), p('After')),
    );
    expect(children[1].id).toBe('inner');
  });

  it('keeps the blocks of a container, such as columns, in the panel', () => {
    const editor = normalize([
      accordion(
        panel('a', 'A', {
          type: 'column_group',
          children: [
            { type: 'column', width: '50%', children: [p('Left')] },
            { type: 'column', width: '50%', children: [p('Right')] },
          ],
        }),
      ),
    ]);
    expect((editor.children[0] as any).children[0].children[1]).toEqual(
      content(p('Left'), p('Right')),
    );
  });

  it('moves the blocks a panel cannot hold after the accordion, in order', () => {
    const unknown = (text: string) => ({
      type: 'unknown_block',
      children: [{ text }],
    });
    const editor = normalize([
      accordion(
        panel('a', 'A', unknown('First'), p('Kept'), unknown('Second')),
      ),
    ]);
    const children = editor.children as any[];
    expect(children.map((child) => child.type)).toEqual([
      'accordion',
      'unknown_block',
      'unknown_block',
    ]);
    expect(children[1]).toEqual(unknown('First'));
    expect(children[2]).toEqual(unknown('Second'));
    expect(children[0].children[0].children[1]).toEqual(content(p('Kept')));
  });

  it('gives an emptied panel content an empty paragraph', () => {
    const editor = normalize([
      accordion(
        panel('a', 'A', { type: 'unknown_block', children: [{ text: 'x' }] }),
      ),
    ]);
    expect((editor.children[0] as any).children[0].children[1]).toEqual(
      content(p('')),
    );
  });

  it('wraps a panel found outside an accordion in one', () => {
    const editor = normalize([panel('a', 'Lonely')]);
    const [node] = editor.children as any[];
    expect(node).toMatchObject({
      type: 'accordion',
      exclusive: true,
      theme: 'white',
      children: [{ type: 'accordion_panel', id: 'a' }],
    });
  });

  it('turns a title found outside a panel into a paragraph', () => {
    const editor = normalize([title('Lost')]);
    expect(editor.children).toEqual([p('Lost')]);
  });

  it('unwraps a content found outside a panel', () => {
    const editor = normalize([content(p('Loose'))]);
    expect(editor.children).toEqual([p('Loose')]);
  });

  describe('Plone blocks', () => {
    const image = {
      type: PLONE_BLOCK_TYPE,
      '@type': 'image',
      children: [{ text: '' }],
    };
    const maps = {
      type: PLONE_BLOCK_TYPE,
      '@type': 'maps',
      children: [{ text: '' }],
    };

    it('keeps the allowed Plone blocks when the editor has the adapter', () => {
      blocks.blocksConfig = { image: {}, maps: {} };
      const editor = normalize(
        [accordion(panel('a', 'A', image, maps))],
        [PloneBlockPlugin],
      );
      const children = editor.children as any[];
      expect(children[0].children[0].children[1]).toEqual(content(image));
      expect(children[1]).toEqual(maps);
    });

    it('moves Plone blocks out of a panel when the editor has no adapter', () => {
      blocks.blocksConfig = { image: {} };
      const editor = normalize([accordion(panel('a', 'A', p('Text'), image))]);
      const children = editor.children as any[];
      expect(children[0].children[0].children[1]).toEqual(content(p('Text')));
      expect(children[1]).toEqual(image);
    });
  });
});

describe('getAvailableInnerBlocks', () => {
  it('offers the allowed blocks that the editor has', () => {
    blocks.blocksConfig = { image: {}, teaser: {} };
    const editor = normalize([], [PloneBlockPlugin]);
    expect(getAvailableInnerBlocks(editor)).toEqual([
      'p',
      'table',
      'hr',
      'image',
      'teaser',
    ]);
  });

  it('works with no registry configuration', () => {
    blocks.blocksConfig = undefined;
    const editor = normalize([]);
    expect(getAvailableInnerBlocks(editor)).toEqual(['p', 'table', 'hr']);
  });

  it('never offers an accordion', () => {
    const editor = normalize(
      [],
      [
        BaseAccordionPlugin.configure({
          options: { allowedBlocks: ['p', 'accordion'] },
        }),
      ],
    );
    expect(getAvailableInnerBlocks(editor)).toEqual(['p']);
  });
});
