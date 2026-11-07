import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import { BaseSlashPlugin } from '@platejs/slash-command';
import { createSlatePlugin, KEYS, NodeApi } from 'platejs';
import {
  Plate,
  PlateContent,
  createPlateEditor,
  toPlatePlugin,
} from 'platejs/react';
import { toast } from 'sonner';

import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { getClosestPloneBlockEntry } from '../plone-block-adapter';
import {
  getDefaultSlashMenuGroups,
  getSlashItemBlockId,
  resolveSlashMenuGroups,
} from '../slash-menu';
import { TableKit } from '../table-kit';
import { handleAccordionKeyDown } from './accordion-editor-plugin';
import { AccordionKit } from './accordion-kit';
import {
  duplicateInnerBlock,
  getTurnIntoOptions,
  insertInnerBlockAt,
  moveInnerBlock,
  removeInnerBlock,
  turnIntoInnerBlock,
} from './inner-block-transforms';

vi.mock('sonner', () => ({
  toast: vi.fn(),
  Toaster: () => null,
}));

const PloneBlockPlugin = toPlatePlugin(
  createSlatePlugin({
    key: PLONE_BLOCK_TYPE,
    node: { isElement: true, isVoid: true },
  }),
);

const p = (text: string, extra: object = {}) => ({
  type: 'p',
  children: [{ text }],
  ...extra,
});
const image = {
  type: PLONE_BLOCK_TYPE,
  '@type': 'image',
  children: [{ text: '' }],
};
const panel = (id: string, title: string, ...blocks: object[]) => ({
  type: 'accordion_panel',
  id,
  startOpen: false,
  anchor: '',
  children: [
    { type: 'accordion_panel_title', children: [{ text: title }] },
    { type: 'accordion_panel_content', children: blocks },
  ],
});
const accordion = (...panels: object[]) => ({
  type: 'accordion',
  id: 'acc',
  exclusive: true,
  theme: 'white',
  children: panels,
});

const createEditor = (value: object[]) =>
  createPlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      ...TableKit,
      PloneBlockPlugin,
      ...AccordionKit,
    ],
    value: structuredClone(value) as any,
  });

const blocksOf = (editor: any) =>
  editor.children[0].children[0].children[1].children;

const registry = config.blocks as Record<string, unknown>;
let blocksConfig: unknown;

beforeEach(() => {
  blocksConfig = registry.blocksConfig;
  registry.blocksConfig = {
    image: { id: 'image', title: 'Image' },
    teaser: { id: 'teaser', title: 'Teaser' },
  };
  vi.mocked(toast).mockClear();
});

afterEach(() => {
  registry.blocksConfig = blocksConfig;
});

describe('slash menu in a panel', () => {
  it('knows which block an item inserts', () => {
    expect(getSlashItemBlockId('p')).toBe('p');
    expect(getSlashItemBlockId(KEYS.ul)).toBe('p');
    expect(getSlashItemBlockId(KEYS.listTodo)).toBe('p');
    expect(getSlashItemBlockId('block_image')).toBe('image');
    expect(getSlashItemBlockId('action_three_columns')).toBe('column_group');
  });

  it('only offers the blocks a panel can hold', () => {
    const editor = createEditor([accordion(panel('a', 'A', p('')))]);
    const values = resolveSlashMenuGroups(editor, undefined, {
      hasTitleBlock: true,
      container: {
        type: 'accordion',
        availableBlocks: ['p', 'table', 'hr', 'image', 'teaser'],
      },
    })
      .flatMap((group) => group.items)
      .map((item) => item.value);

    expect(values).toEqual(
      expect.arrayContaining(['p', KEYS.ul, KEYS.ol, 'table', 'block_image']),
    );
    for (const value of ['h2', 'blockquote', 'toggle', 'accordion']) {
      expect(values).not.toContain(value);
    }
  });

  it('offers every block outside a container', () => {
    const editor = createEditor([p('')]);
    const values = (groups: { items: { value: string }[] }[]) =>
      groups.flatMap((group) => group.items).map((item) => item.value);

    expect(
      values(
        resolveSlashMenuGroups(editor, undefined, { hasTitleBlock: true }),
      ),
    ).toEqual(
      values(getDefaultSlashMenuGroups(editor, { hasTitleBlock: true })),
    );
  });
});

describe('blocks of a panel', () => {
  it('moves a block within its panel', () => {
    const editor = createEditor([
      accordion(panel('a', 'A', p('One'), p('Two'))),
    ]);

    expect(moveInnerBlock(editor, [0, 0, 1, 0], -1)).toBe(false);
    expect(moveInnerBlock(editor, [0, 0, 1, 0], 1)).toBe(true);
    expect(blocksOf(editor)).toEqual([p('Two'), p('One')]);
  });

  it('moves the block that holds the caret with Alt+Shift+arrows', () => {
    const editor = createEditor([
      accordion(panel('a', 'A', p('One'), p('Two'))),
    ]);
    editor.tf.select(editor.api.start([0, 0, 1, 1]));
    const event = {
      key: 'ArrowUp',
      altKey: true,
      shiftKey: true,
      preventDefault: () => {},
    };

    expect(handleAccordionKeyDown(editor, event)).toBe(true);
    expect(blocksOf(editor)).toEqual([p('Two'), p('One')]);
  });

  it('duplicates a block after it', () => {
    const editor = createEditor([accordion(panel('a', 'A', p('One')))]);

    duplicateInnerBlock(editor, [0, 0, 1, 0]);

    expect(blocksOf(editor)).toEqual([p('One'), p('One')]);
    expect(editor.selection?.anchor.path).toEqual([0, 0, 1, 1, 0]);
  });

  it('deletes a block, offers to undo it, and keeps the panel holding a block', () => {
    const editor = createEditor([accordion(panel('a', 'A', image))]);

    removeInnerBlock(editor, [0, 0, 1, 0]);

    expect(blocksOf(editor)).toEqual([p('')]);
    expect(toast).toHaveBeenCalledWith('Image block deleted', {
      duration: 8000,
      action: { label: 'Undo', onClick: expect.any(Function) },
    });

    editor.undo();
    expect(blocksOf(editor)).toEqual([image]);
  });

  it('turns text into a paragraph, keeping its text', () => {
    const editor = createEditor([
      accordion(
        panel('a', 'A', p('Item', { indent: 1, listStyleType: 'disc' })),
      ),
    ]);

    turnIntoInnerBlock(editor, [0, 0, 1, 0], 'p');

    expect(blocksOf(editor)).toEqual([p('Item')]);
  });

  it('turns a block into another type, which starts empty', () => {
    const editor = createEditor([accordion(panel('a', 'A', p('Some text')))]);

    turnIntoInnerBlock(editor, [0, 0, 1, 0], 'image');
    expect(blocksOf(editor)).toEqual([image]);

    turnIntoInnerBlock(editor, [0, 0, 1, 0], 'hr');
    expect(blocksOf(editor)).toEqual([
      { type: 'hr', children: [{ text: '' }] },
    ]);

    turnIntoInnerBlock(editor, [0, 0, 1, 0], 'table');
    expect(blocksOf(editor)[0].type).toBe('table');
  });

  it('offers the other available blocks to turn a block into', () => {
    const editor = createEditor([accordion(panel('a', 'A', p('Text')))]);
    const node = blocksOf(editor)[0];

    expect(getTurnIntoOptions(editor, node)).toEqual([
      'table',
      'hr',
      'image',
      'teaser',
    ]);
  });
});

describe('Plone blocks in a panel', () => {
  it('finds the Plone block that holds the selection, not the accordion', () => {
    const editor = createEditor([accordion(panel('a', 'A', p('Text'), image))]);
    editor.tf.select({ path: [0, 0, 1, 1, 0], offset: 0 });

    const [node, path] = getClosestPloneBlockEntry(editor as any)!;
    expect(path).toEqual([0, 0, 1, 1]);
    expect(node['@type']).toBe('image');
  });

  it('finds the closest block otherwise', () => {
    const editor = createEditor([accordion(panel('a', 'A', p('Text')))]);
    editor.tf.select(editor.api.start([0, 0, 1, 0]));

    expect(getClosestPloneBlockEntry(editor as any)?.[1]).toEqual([0, 0, 1, 0]);
  });
});

describe('block toolbar', () => {
  it('shows a toolbar and an insert point for each block of an active accordion', () => {
    const editor = createEditor([
      accordion(panel('a', 'Hours', p('One'), p('Two'))),
    ]);
    editor.tf.select(editor.api.start([0, 0, 1, 0]));
    render(
      <Plate editor={editor}>
        <PlateContent />
      </Plate>,
    );

    expect(
      screen.getAllByRole('button', { name: 'Block actions' }),
    ).toHaveLength(2);
    const up = screen.getAllByRole('button', { name: 'Move block up' });
    expect(up[0]).toBeDisabled();
    expect(up[1]).toBeEnabled();
    expect(
      screen.getByRole('button', {
        name: 'Insert a block at the top of “Hours”',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Insert a block between block 1 and 2 of “Hours”',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add a block to “Hours”' }),
    ).toBeInTheDocument();
  });

  it('shows only the add control at the end of a panel while the selection is outside the accordion', () => {
    const editor = createEditor([
      accordion(panel('a', 'Hours', p('One'))),
      p(''),
    ]);
    editor.tf.select(editor.api.start([1]));
    render(
      <Plate editor={editor}>
        <PlateContent />
      </Plate>,
    );

    expect(screen.queryByRole('button', { name: 'Block actions' })).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: 'Insert a block at the top of “Hours”',
      }),
    ).toBeNull();
    // It's shown while the pointer is over the panel.
    expect(
      screen.getByRole('button', { name: 'Add a block to “Hours”' }),
    ).toBeInTheDocument();
  });
});

describe('insert points', () => {
  it('opens the slash menu in a new block without typing "/"', () => {
    const editor = createPlateEditor({
      plugins: [...BaseBasicBlocksKit, BaseSlashPlugin, ...AccordionKit],
      value: structuredClone([accordion(panel('a', 'Hours', p('One')))]) as any,
    });

    insertInnerBlockAt(editor, [0, 0, 1], 1);

    const block = blocksOf(editor)[1];
    expect(block.type).toBe('p');
    expect(NodeApi.string(block)).toBe('');
    expect(block.children).toContainEqual(
      expect.objectContaining({ type: KEYS.slashInput, withoutTrigger: true }),
    );
  });

  it('adds an empty block in editors without the slash menu', () => {
    const editor = createEditor([accordion(panel('a', 'Hours', p('One')))]);

    insertInnerBlockAt(editor, [0, 0, 1], 0);

    expect(blocksOf(editor)[0]).toMatchObject({
      type: 'p',
      children: [{ text: '' }],
    });
    expect(editor.selection?.anchor.path).toEqual([0, 0, 1, 0, 0]);
  });
});
