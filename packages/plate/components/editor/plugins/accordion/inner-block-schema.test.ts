import { describe, expect, it } from 'vitest';
import { createSlateEditor } from 'platejs';

import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { BaseAccordionKit } from './accordion-base-kit';
import { BaseAccordionPlugin } from './accordion-plugin';
import { enhanceInnerBlockSchema } from './inner-block-schema';

const imageSchema = () => ({
  title: 'Image',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['url', 'alt', 'blockWidth', 'align', 'size'],
    },
  ],
  properties: {
    url: { title: 'Image' },
    alt: { title: 'Alt text' },
    blockWidth: { title: 'Width' },
    align: { title: 'Alignment' },
    size: { title: 'Image size' },
  },
  required: [],
});

const teaserSchema = () => ({
  title: 'Teaser',
  fieldsets: [{ id: 'default', title: 'Default', fields: ['href', 'theme'] }],
  properties: { href: { title: 'Target' }, theme: { title: 'Theme' } },
  required: [],
});

const value = [
  {
    type: 'accordion',
    id: 'acc',
    exclusive: true,
    theme: 'white',
    children: [
      {
        type: 'accordion_panel',
        id: 'a',
        startOpen: false,
        anchor: '',
        children: [
          { type: 'accordion_panel_title', children: [{ text: 'A' }] },
          {
            type: 'accordion_panel_content',
            children: [{ type: 'p', children: [{ text: '' }] }],
          },
        ],
      },
    ],
  },
  { type: 'p', children: [{ text: '' }] },
];

const createEditor = (plugins: any[] = []) =>
  createSlateEditor({
    plugins: [...BaseBasicBlocksKit, ...BaseAccordionKit, ...plugins],
    value: structuredClone(value) as any,
  });

const inPanel = [0, 0, 1, 0];
const outside = [1];

describe('settings of the blocks inside an accordion', () => {
  it('leaves out the size and alignment of images', () => {
    const schema = enhanceInnerBlockSchema(
      createEditor(),
      inPanel,
      imageSchema() as any,
      'image',
    );
    expect(schema.fieldsets[0].fields).toEqual(['url', 'alt']);
    expect(Object.keys(schema.properties)).toEqual(['url', 'alt']);
    expect(schema.description).toContain("the panel's full width");
  });

  it('leaves out the background of teasers', () => {
    const schema = enhanceInnerBlockSchema(
      createEditor(),
      inPanel,
      teaserSchema() as any,
      'teaser',
    );
    expect(schema.fieldsets[0].fields).toEqual(['href']);
  });

  it('keeps the schema of blocks outside an accordion', () => {
    const original = imageSchema();
    expect(
      enhanceInnerBlockSchema(
        createEditor(),
        outside,
        original as any,
        'image',
      ),
    ).toBe(original);
  });

  it('keeps the schema of other blocks', () => {
    const original = { ...teaserSchema(), title: 'Listing' };
    expect(
      enhanceInnerBlockSchema(
        createEditor(),
        inPanel,
        original as any,
        'listing',
      ),
    ).toBe(original);
  });

  it('uses the rules of the plugin options', () => {
    const editor = createEditor([
      BaseAccordionPlugin.configure({
        options: {
          innerBlockSchemaEnhancer: (schema: any) => ({
            ...schema,
            title: 'Changed',
          }),
        },
      }),
    ]);
    expect(
      enhanceInnerBlockSchema(editor, inPanel, imageSchema() as any, 'image')
        .title,
    ).toBe('Changed');
  });
});
