import { render, screen } from '@testing-library/react';
import { useBlockContainer } from '@plone/helpers';
import { createSlateEditor, type Value } from 'platejs';
import { describe, expect, it } from 'vitest';

import {
  GridColumnContext,
  GridRenderProvider,
} from '../../../ui/grid-node-static';
import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { enhanceInnerBlockSchema } from '../containers';
import { BaseGridColumnPlugin, BaseGridPlugin } from './grid-plugin';

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
    url: {},
    alt: {},
    blockWidth: {},
    align: {},
    size: {},
  },
  required: [],
});

const teaserSchema = () => ({
  title: 'Teaser',
  fieldsets: [{ id: 'default', title: 'Default', fields: ['href', 'theme'] }],
  properties: { href: {}, theme: {} },
  required: [],
});

const image = {
  type: 'ploneBlock',
  '@type': 'image',
  children: [{ text: '' }],
};
const grid = {
  type: 'grid',
  id: 'g',
  theme: 'grey',
  gap: 'm',
  stack: true,
  children: [
    { type: 'grid_column', id: 'a', size: 2, children: [image] },
    {
      type: 'grid_column',
      id: 'b',
      size: 1,
      children: [{ type: 'p', children: [{ text: 'B' }] }],
    },
  ],
};

const createEditor = (options: Record<string, unknown> = {}) =>
  createSlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      BaseGridPlugin.configure({ options }),
      BaseGridColumnPlugin,
    ],
    value: structuredClone([grid, image]) as Value,
  });

describe('the settings of blocks inside a grid', () => {
  it('leaves out the size and alignment of images, with a note', () => {
    const schema = enhanceInnerBlockSchema(
      createEditor(),
      [0, 0, 0],
      imageSchema() as any,
      'image',
    );
    expect(schema.fieldsets[0].fields).toEqual(['url', 'alt']);
    expect(schema.description).toContain("its column's width");
  });

  it('leaves out the background of teasers', () => {
    const schema = enhanceInnerBlockSchema(
      createEditor(),
      [0, 0, 0],
      teaserSchema() as any,
      'teaser',
    );
    expect(schema.fieldsets[0].fields).toEqual(['href']);
  });

  it('keeps the settings of an image outside a grid', () => {
    expect(
      enhanceInnerBlockSchema(
        createEditor(),
        [1],
        imageSchema() as any,
        'image',
      ).fieldsets[0].fields,
    ).toHaveLength(5);
  });

  it('lets a project replace the rule of a block type', () => {
    const editor = createEditor({
      blocksConfig: { image: { schemaEnhancer: (schema: any) => schema } },
    });
    expect(
      enhanceInnerBlockSchema(editor, [0, 0, 0], imageSchema() as any, 'image')
        .fieldsets[0].fields,
    ).toHaveLength(5);
    // The other defaults stay.
    expect(
      enhanceInnerBlockSchema(
        editor,
        [0, 0, 0],
        teaserSchema() as any,
        'teaser',
      ).fieldsets[0].fields,
    ).toEqual(['href']);
  });
});

function Probe() {
  const container = useBlockContainer();
  return (
    <span>
      {container
        ? `${container.type} ${container.index + 1}/${container.count} ${container.size}/${container.totalSize} ${String(container.data.theme)}`
        : 'none'}
    </span>
  );
}

describe('the container context of a column', () => {
  it('tells a block its column, weight and the grid data', () => {
    render(
      <GridRenderProvider value={grid as any}>
        <GridColumnContext column={grid.children[0] as any}>
          <Probe />
        </GridColumnContext>
      </GridRenderProvider>,
    );
    expect(screen.getByText('grid 1/2 2/3 grey')).toBeTruthy();
  });

  it('is empty outside a grid', () => {
    render(<Probe />);
    expect(screen.getByText('none')).toBeTruthy();
  });
});
