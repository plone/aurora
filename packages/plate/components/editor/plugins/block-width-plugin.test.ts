import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import { createSlateEditor, type Value } from 'platejs';

import {
  BaseBlockWidthPlugin,
  FALLBACK_BLOCK_WIDTH,
  getBlockWidthConfig,
  getDefaultBlockWidth,
  getBlockWidthDefinitions,
  getBlockWidthOptions,
} from './block-width-plugin';
import {
  BaseStyleFieldsPlugin,
  resetStyleFieldOnEditor,
  setStyleFieldOnEditor,
} from './style-fields-plugin';
import { BaseBasicBlocksKit } from './basic-blocks-base-kit';
import { BaseCalloutKit } from './callout-base-kit';

type RegistryBlocksState = {
  widths?: unknown;
  plateBlocksConfig?: unknown;
  blocksConfig?: unknown;
  utilities?: unknown;
};

type TransformPropsArgs = {
  editor?: unknown;
  element?: Record<string, unknown>;
  props: {
    style?: Record<string, string>;
  };
};

type TransformPropsFn = (args: TransformPropsArgs) => {
  style: Record<string, string>;
};

const registryBlocks = config.blocks as Record<string, unknown>;

const snapshotRegistryState = (): RegistryBlocksState => ({
  widths: registryBlocks.widths,
  plateBlocksConfig: registryBlocks.plateBlocksConfig,
  blocksConfig: registryBlocks.blocksConfig,
  utilities: config.utilities,
});

const restoreRegistryState = (state: RegistryBlocksState) => {
  registryBlocks.widths = state.widths;
  registryBlocks.plateBlocksConfig = state.plateBlocksConfig;
  registryBlocks.blocksConfig = state.blocksConfig;
  config.utilities = state.utilities as any;
};

const initialRegistryState = snapshotRegistryState();

const createEditor = (defaultWidths = ['default']) =>
  ({
    getOptions: vi.fn(() => ({ defaultWidths })),
  }) as any;

afterEach(() => {
  restoreRegistryState(initialRegistryState);
});

beforeEach(() => {
  config.registerUtility({
    type: 'styleFieldDefinition',
    name: 'blockWidth',
    method: () => (registryBlocks.widths as any) ?? [],
  });
});

describe('block width plugin', () => {
  it('falls back to the default width definitions when config.blocks.widths is unset', () => {
    registryBlocks.widths = undefined;

    expect(getBlockWidthDefinitions()).toEqual([
      {
        style: { '--block-width': 'var(--narrow-container-width)' },
        name: 'narrow',
        label: 'Narrow',
      },
      {
        style: { '--block-width': 'var(--default-container-width)' },
        name: 'default',
        label: 'Default',
      },
      {
        style: { '--block-width': 'var(--layout-container-width)' },
        name: 'layout',
        label: 'Layout',
      },
      {
        style: { '--block-width': '100%' },
        name: 'full',
        label: 'Full Width',
      },
    ]);
  });

  it('reads width definitions and toolbar options from config.blocks.widths', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'cinema',
        label: 'Cinema',
        style: { '--block-width': '120ch' },
      },
    ];

    expect(getBlockWidthDefinitions()).toEqual(registryBlocks.widths);
    expect(getBlockWidthOptions()).toEqual([
      { label: 'Default', value: 'default' },
      { label: 'Cinema', value: 'cinema' },
    ]);
  });

  it('resolves plate block width config from config.blocks.plateBlocksConfig', () => {
    registryBlocks.plateBlocksConfig = {
      p: {
        blockWidth: {
          defaultWidth: 'narrow',
          widths: ['narrow'],
        },
      },
    };

    const editor = createEditor();

    expect(
      getBlockWidthConfig(editor, {
        type: 'p',
        children: [{ text: 'Paragraph' }],
      } as any),
    ).toEqual({
      defaultWidth: 'narrow',
      widths: ['narrow'],
    });
  });

  it('uses the baseline default for ploneBlock style fields without schema style fields', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.blocksConfig = {
      image: {
        blockSchema: {
          title: 'Image',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };

    const transformProps = (BaseStyleFieldsPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        element: {
          type: PLONE_BLOCK_TYPE,
          '@type': 'image',
          children: [{ text: '' }],
        },
        props: {
          style: {
            color: 'red',
          },
        },
      }),
    ).toEqual({
      'data-style-block-width': 'default',
      style: {
        color: 'red',
        '--block-width': 'var(--default-container-width)',
      },
    });
  });

  it('uses blockWidth data as a baseline style field for ploneBlock nodes without schema style fields', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'full',
        label: 'Full Width',
        style: { '--block-width': '100%' },
      },
    ];
    registryBlocks.blocksConfig = {
      teaser: {
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };

    const transformProps = (BaseStyleFieldsPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        element: {
          type: PLONE_BLOCK_TYPE,
          '@type': 'teaser',
          blockWidth: 'full',
          children: [{ text: '' }],
        },
        props: {
          style: {
            color: 'red',
          },
        },
      }),
    ).toEqual({
      'data-style-block-width': 'full',
      style: {
        color: 'red',
        '--block-width': '100%',
      },
    });
  });

  it('uses defaultBlockWidth for ploneBlock nodes without schema style fields', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.blocksConfig = {
      teaser: {
        defaultBlockWidth: 'layout',
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };

    const transformProps = (BaseStyleFieldsPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        element: {
          type: PLONE_BLOCK_TYPE,
          '@type': 'teaser',
          children: [{ text: '' }],
        },
        props: {
          style: {
            color: 'red',
          },
        },
      }),
    ).toEqual({
      'data-style-block-width': 'layout',
      style: {
        color: 'red',
        '--block-width': 'var(--layout-container-width)',
      },
    });
  });

  it('adds the baseline default blockWidth to created ploneBlock nodes without schema style fields', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'full',
        label: 'Full Width',
        style: { '--block-width': '100%' },
      },
    ];
    registryBlocks.blocksConfig = {
      teaser: {
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };

    const node = {
      type: PLONE_BLOCK_TYPE,
      '@type': 'teaser',
      children: [{ text: '' }],
    };
    const editor = {
      api: {
        create: {
          block: vi.fn(() => node),
        },
      },
    } as any;

    const extendedEditor = (BaseStyleFieldsPlugin as any).extendEditor({
      editor,
    });

    expect(extendedEditor.api.create.block()).toEqual({
      ...node,
      blockWidth: 'default',
    });
  });

  it('does not add style field defaults to nested created ploneBlock descendants', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.blocksConfig = {
      teaser: {
        defaultBlockWidth: 'default',
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };

    const node = {
      type: PLONE_BLOCK_TYPE,
      '@type': 'teaser',
      title: 'Root teaser',
      children: [
        {
          type: PLONE_BLOCK_TYPE,
          '@type': 'teaser',
          title: 'Nested teaser',
          description: 'Nested teaser body',
          children: [
            {
              type: 'p',
              children: [
                { text: 'Nested teaser text with ' },
                {
                  type: 'a',
                  url: 'https://plone.org',
                  children: [{ text: 'a link' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const editor = {
      api: {
        create: {
          block: vi.fn(() => node),
        },
      },
      tf: {
        insertNodes: vi.fn(),
        setNodes: vi.fn(),
        wrapNodes: vi.fn(),
      },
    } as any;
    const extendedEditor = (BaseStyleFieldsPlugin as any).extendEditor({
      editor,
    });

    expect(extendedEditor.api.create.block()).toEqual({
      ...node,
      blockWidth: 'default',
    });
  });

  it('adds configured defaultBlockWidth when creating ploneBlock nodes without schema style fields', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.blocksConfig = {
      teaser: {
        defaultBlockWidth: 'layout',
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };

    const node = {
      type: PLONE_BLOCK_TYPE,
      '@type': 'teaser',
      children: [{ text: '' }],
    };
    const editor = {
      api: {
        create: {
          block: vi.fn(() => node),
        },
      },
      tf: {
        insertNodes: vi.fn(),
        setNodes: vi.fn(),
        wrapNodes: vi.fn(),
      },
    } as any;

    const extendedEditor = (BaseStyleFieldsPlugin as any).extendEditor({
      editor,
    });

    expect(extendedEditor.api.create.block()).toEqual({
      ...node,
      blockWidth: 'layout',
    });
  });

  it('adds configured defaultBlockWidth when normalizing initial ploneBlock values without schema style fields', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.blocksConfig = {
      teaser: {
        defaultBlockWidth: 'layout',
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };

    const value = [
      {
        type: PLONE_BLOCK_TYPE,
        '@type': 'teaser',
        children: [{ text: '' }],
      },
    ];

    (BaseStyleFieldsPlugin as any).normalizeInitialValue({ value });

    expect(value).toEqual([
      {
        type: PLONE_BLOCK_TYPE,
        '@type': 'teaser',
        blockWidth: 'layout',
        children: [{ text: '' }],
      },
    ]);
  });

  it('does not add style field defaults to nested initial ploneBlock descendants', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.blocksConfig = {
      teaser: {
        defaultBlockWidth: 'layout',
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };

    const value = [
      {
        type: PLONE_BLOCK_TYPE,
        '@type': 'teaser',
        title: 'Root teaser',
        children: [
          {
            type: PLONE_BLOCK_TYPE,
            '@type': 'teaser',
            title: 'Nested teaser',
            description: 'Nested teaser body',
            children: [
              {
                type: 'p',
                children: [
                  { text: 'Nested teaser text with ' },
                  {
                    type: 'a',
                    url: 'https://plone.org',
                    children: [{ text: 'a link' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    (BaseStyleFieldsPlugin as any).normalizeInitialValue({ value });

    expect(value).toEqual([
      {
        type: PLONE_BLOCK_TYPE,
        '@type': 'teaser',
        title: 'Root teaser',
        blockWidth: 'layout',
        children: [
          {
            type: PLONE_BLOCK_TYPE,
            '@type': 'teaser',
            title: 'Nested teaser',
            description: 'Nested teaser body',
            children: [
              {
                type: 'p',
                children: [
                  { text: 'Nested teaser text with ' },
                  {
                    type: 'a',
                    url: 'https://plone.org',
                    children: [{ text: 'a link' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('uses schema-marked blockWidth style fields for ploneBlock nodes', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.blocksConfig = {
      image: {
        blockSchema: {
          title: 'Image',
          fieldsets: [],
          required: [],
          properties: {
            blockWidth: {
              default: 'layout',
              choices: [
                ['default', 'Default'],
                ['layout', 'Layout'],
              ],
              styleField: true,
            },
          },
        },
      },
    };

    const transformProps = (BaseStyleFieldsPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        element: {
          type: PLONE_BLOCK_TYPE,
          '@type': 'image',
          children: [{ text: '' }],
        },
        props: {
          style: {
            color: 'red',
          },
        },
      }),
    ).toEqual({
      'data-style-block-width': 'layout',
      style: {
        color: 'red',
        '--block-width': 'var(--layout-container-width)',
      },
    });
  });

  it('does not leak the raw blockWidth field into ploneBlock inline styles', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.blocksConfig = {
      image: {
        blockSchema: {
          title: 'Image',
          fieldsets: [],
          required: [],
          properties: {
            blockWidth: {
              default: 'default',
              choices: [['default', 'Default']],
              styleField: true,
            },
          },
        },
      },
    };

    const blockWidthNodeProps = (BaseBlockWidthPlugin as any).inject.nodeProps;
    const blockElement = {
      type: PLONE_BLOCK_TYPE,
      '@type': 'image',
      blockWidth: 'default',
      children: [{ text: '' }],
    };
    const transformProps = (BaseStyleFieldsPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      blockWidthNodeProps.query({
        nodeProps: {
          element: blockElement,
        },
      }),
    ).toBe(false);
    expect(blockWidthNodeProps.transformStyle()).toEqual({});
    expect(
      transformProps({
        element: blockElement,
        props: {
          style: {
            position: 'relative',
          },
        },
      }),
    ).toEqual({
      'data-style-block-width': 'default',
      style: {
        position: 'relative',
        '--block-width': 'var(--default-container-width)',
      },
    });
  });

  it('adds the default width to the allowed list when the config omits it', () => {
    registryBlocks.plateBlocksConfig = {
      p: {
        blockWidth: {
          defaultWidth: 'default',
          widths: ['narrow'],
        },
      },
    };

    const editor = createEditor();
    const result = getBlockWidthConfig(editor, {
      type: 'p',
      children: [{ text: 'Paragraph' }],
    } as any);

    expect(result.defaultWidth).toBe('default');
    expect(result.widths).toEqual(['narrow', 'default']);
  });

  it('injects the resolved width style object into node props', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'full',
        label: 'Full Width',
        style: { '--block-width': '100%' },
      },
    ];
    registryBlocks.plateBlocksConfig = {
      p: {
        blockWidth: {
          defaultWidth: 'default',
          widths: ['default', 'full'],
        },
      },
    };

    const transformProps = (BaseBlockWidthPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        element: {
          type: 'p',
          blockWidth: 'full',
          children: [{ text: 'Paragraph' }],
        },
        props: {
          style: {
            color: 'red',
          },
        },
      }),
    ).toEqual({
      style: {
        color: 'red',
        '--block-width': '100%',
      },
    });

    expect(getDefaultBlockWidth()).toBe('default');
    expect(FALLBACK_BLOCK_WIDTH).toBe('default');
  });

  it('uses the configured default width style when blockWidth is missing', () => {
    registryBlocks.widths = [
      {
        name: 'narrow',
        label: 'Narrow',
        style: { '--block-width': 'var(--narrow-container-width)' },
      },
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
    ];
    registryBlocks.plateBlocksConfig = {
      p: {
        blockWidth: {
          defaultWidth: 'narrow',
          widths: ['narrow'],
        },
      },
    };

    const editor = createEditor();
    const transformProps = (BaseBlockWidthPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        editor,
        element: {
          type: 'p',
          children: [{ text: 'Paragraph without width' }],
        },
        props: {
          style: {
            color: 'red',
          },
        },
      } as any),
    ).toEqual({
      style: {
        color: 'red',
        '--block-width': 'var(--narrow-container-width)',
      },
    });
  });

  it('adds block width defaults only to top-level initial native Plate blocks', () => {
    registryBlocks.widths = [
      {
        name: 'narrow',
        label: 'Narrow',
        style: { '--block-width': 'var(--narrow-container-width)' },
      },
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.plateBlocksConfig = {
      code_block: {
        blockWidth: {
          defaultWidth: 'layout',
          widths: ['layout'],
        },
      },
      code_line: {
        blockWidth: {
          defaultWidth: 'narrow',
          widths: ['narrow'],
        },
      },
    };

    const value = [
      {
        children: [
          {
            children: [{ text: 'and code as a block' }],
            id: 'PNn1nGth7G',
            type: 'code_line',
          },
        ],
        id: 'kI_CM1pABf',
        type: 'code_block',
      },
      {
        type: 'p',
        children: [
          {
            type: 'span',
            children: [{ text: 'Nested inline text' }],
          },
        ],
      },
    ];

    (BaseBlockWidthPlugin as any).normalizeInitialValue({ value });

    expect(value).toEqual([
      {
        blockWidth: 'layout',
        children: [
          {
            children: [{ text: 'and code as a block' }],
            id: 'PNn1nGth7G',
            type: 'code_line',
          },
        ],
        id: 'kI_CM1pABf',
        type: 'code_block',
      },
      {
        type: 'p',
        blockWidth: 'default',
        children: [
          {
            type: 'span',
            children: [{ text: 'Nested inline text' }],
          },
        ],
      },
    ]);
  });

  it('adds block width defaults to created native Plate blocks', () => {
    registryBlocks.widths = [
      {
        name: 'narrow',
        label: 'Narrow',
        style: { '--block-width': 'var(--narrow-container-width)' },
      },
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.plateBlocksConfig = {
      code_block: {
        blockWidth: {
          defaultWidth: 'layout',
          widths: ['layout'],
        },
      },
      code_line: {
        blockWidth: {
          defaultWidth: 'narrow',
          widths: ['narrow'],
        },
      },
    };

    const node = {
      children: [
        {
          children: [{ text: 'and code as a block' }],
          id: 'PNn1nGth7G',
          type: 'code_line',
        },
      ],
      id: 'kI_CM1pABf',
      type: 'code_block',
    };
    const editor = {
      getOptions: vi.fn(() => ({ defaultWidths: ['default'] })),
      api: {
        create: {
          block: vi.fn(() => node),
        },
        isBlock: vi.fn((element) => element.type === 'code_block'),
      },
      tf: {
        insertNodes: vi.fn(),
        setNodes: vi.fn(),
        wrapNodes: vi.fn(),
      },
    } as any;
    const extendedEditor = (BaseBlockWidthPlugin as any).extendEditor({
      editor,
    });

    expect(extendedEditor.api.create.block()).toEqual({
      ...node,
      blockWidth: 'layout',
    });
  });

  it('normalizes missing block width on top-level registered native Plate blocks', () => {
    registryBlocks.widths = [
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
      {
        name: 'narrow',
        label: 'Narrow',
        style: { '--block-width': 'var(--narrow-container-width)' },
      },
    ];
    registryBlocks.plateBlocksConfig = {
      code_block: {
        category: 'text',
      },
      code_line: {
        blockWidth: {
          defaultWidth: 'narrow',
          widths: ['narrow'],
        },
      },
    };

    const normalizeNode = vi.fn();
    const setNodes = vi.fn();
    const editor = {
      getOptions: vi.fn(() => ({ defaultWidths: ['default'] })),
      normalizeNode,
      api: {
        create: {
          block: vi.fn(),
        },
        isBlock: vi.fn(() => false),
      },
      tf: {
        insertNodes: vi.fn(),
        setNodes,
        wrapNodes: vi.fn(),
      },
    } as any;
    const extendedEditor = (BaseBlockWidthPlugin as any).extendEditor({
      editor,
    });
    const codeBlock = {
      children: [
        {
          children: [{ text: 'and code as a block' }],
          id: 'PNn1nGth7G',
          type: 'code_line',
        },
      ],
      id: 'kI_CM1pABf',
      type: 'code_block',
    };

    extendedEditor.normalizeNode([codeBlock, [1]]);

    expect(setNodes).toHaveBeenCalledWith(
      {
        blockWidth: 'default',
      },
      {
        at: [1],
      },
    );
    expect(normalizeNode).not.toHaveBeenCalled();

    setNodes.mockClear();
    extendedEditor.normalizeNode([codeBlock.children[0], [1, 0]]);

    expect(setNodes).not.toHaveBeenCalled();
    expect(normalizeNode).toHaveBeenCalledWith([codeBlock.children[0], [1, 0]]);
  });

  it('does not inject block width styles into nested native Plate children', () => {
    registryBlocks.widths = [
      {
        name: 'narrow',
        label: 'Narrow',
        style: { '--block-width': 'var(--narrow-container-width)' },
      },
      {
        name: 'layout',
        label: 'Layout',
        style: { '--block-width': 'var(--layout-container-width)' },
      },
    ];
    registryBlocks.plateBlocksConfig = {
      code_block: {
        blockWidth: {
          defaultWidth: 'layout',
          widths: ['layout'],
        },
      },
      code_line: {
        blockWidth: {
          defaultWidth: 'narrow',
          widths: ['narrow'],
        },
      },
    };

    const editor = {
      getOptions: vi.fn(() => ({ defaultWidths: ['default'] })),
      api: {
        isBlock: vi.fn((element) => element.type === 'code_block'),
      },
    } as any;
    const transformProps = (BaseBlockWidthPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;
    const codeBlock = {
      children: [
        {
          blockWidth: 'narrow',
          children: [{ text: 'and code as a block' }],
          id: 'PNn1nGth7G',
          type: 'code_line',
        },
      ],
      id: 'kI_CM1pABf',
      type: 'code_block',
    };
    const codeLine = codeBlock.children[0];

    expect(
      transformProps({
        editor,
        element: codeBlock,
        props: {
          style: {
            color: 'red',
          },
        },
      } as any),
    ).toEqual({
      style: {
        color: 'red',
        '--block-width': 'var(--layout-container-width)',
      },
    });

    expect(
      transformProps({
        editor,
        element: codeLine,
        props: {
          style: {
            color: 'red',
          },
        },
      } as any),
    ).toEqual({
      style: {
        color: 'red',
      },
    });
  });

  it('does not inject block width styles into blocks nested in a container', () => {
    registryBlocks.widths = [
      {
        name: 'narrow',
        label: 'Narrow',
        style: { '--block-width': 'var(--narrow-container-width)' },
      },
      {
        name: 'default',
        label: 'Default',
        style: { '--block-width': 'var(--default-container-width)' },
      },
    ];
    registryBlocks.plateBlocksConfig = {
      blockquote: {
        blockWidth: { defaultWidth: 'default', widths: ['default'] },
      },
      p: {
        blockWidth: { defaultWidth: 'narrow', widths: ['narrow'] },
      },
    };

    const quotedParagraph = {
      type: 'p',
      children: [{ text: 'Quoted' }],
    };
    const blockquote = {
      type: 'blockquote',
      children: [quotedParagraph],
    };
    const editor = {
      children: [blockquote],
      getOptions: vi.fn(() => ({ defaultWidths: ['default'] })),
      api: { isBlock: vi.fn(() => true) },
    } as any;
    const transformProps = (BaseBlockWidthPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({ editor, element: blockquote, props: {} } as any),
    ).toEqual({
      style: { '--block-width': 'var(--default-container-width)' },
    });
    expect(
      transformProps({ editor, element: quotedParagraph, props: {} } as any),
    ).toEqual({});
  });

  it('derives the fallback default width from the registry definitions', () => {
    registryBlocks.widths = [
      {
        name: 'cinema',
        label: 'Cinema',
        style: { '--block-width': '120ch' },
      },
      {
        name: 'wide',
        label: 'Wide',
        style: { '--block-width': '90ch' },
      },
    ];

    expect(getDefaultBlockWidth()).toBe('cinema');
  });

  it('reads and writes nested path style fields through generic transforms', () => {
    registryBlocks.blocksConfig = {
      teaser: {
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {
            theme: {
              title: 'Theme',
              default: 'default',
              choices: [
                ['default', 'Default'],
                ['sand', 'Sand'],
              ],
              styleField: {
                path: 'styles.theme',
              },
            },
          },
        },
      },
    };

    config.registerUtility({
      type: 'styleFieldDefinition',
      name: 'theme',
      method: () => [
        {
          name: 'default',
          label: 'Default',
          style: { '--theme-color': 'white' },
        },
        {
          name: 'sand',
          label: 'Sand',
          style: { '--theme-color': 'wheat' },
        },
      ],
    });

    const setNodes = vi.fn();
    const block = {
      type: PLONE_BLOCK_TYPE,
      '@type': 'teaser',
      styles: {
        theme: 'sand',
      },
      children: [{ text: '' }],
    };
    const editor = {
      api: {
        block: vi.fn(() => [block, [0]]),
        node: vi.fn(() => [block, [0]]),
        blocks: vi.fn(() => [[block, [0]]]),
        isBlock: vi.fn(() => true),
      },
      tf: {
        setNodes,
      },
    } as any;

    const transformProps = (BaseStyleFieldsPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;
    expect(
      transformProps({
        editor,
        element: block,
        props: { style: {} },
      } as any),
    ).toEqual({
      'data-style-theme': 'sand',
      style: {
        '--theme-color': 'wheat',
      },
    });

    setStyleFieldOnEditor(editor, 'theme', 'default');
    expect(setNodes).toHaveBeenCalledWith(
      {
        styles: {
          theme: 'default',
        },
      },
      {
        at: [0],
      },
    );

    setNodes.mockClear();
    resetStyleFieldOnEditor(editor, 'theme');
    expect(setNodes).toHaveBeenCalledWith(
      {
        styles: {
          theme: 'default',
        },
      },
      {
        at: [0],
      },
    );
  });
});

// Real editors, not mocks: whatever a document looks like when it is saved,
// loading it again must not change it. Otherwise every width the editor adds
// on load shows up as a change between two versions of the document.
describe('block width persistence', () => {
  const widths = [
    {
      name: 'narrow',
      label: 'Narrow',
      style: { '--block-width': 'var(--narrow-container-width)' },
    },
    {
      name: 'default',
      label: 'Default',
      style: { '--block-width': 'var(--default-container-width)' },
    },
    {
      name: 'layout',
      label: 'Layout',
      style: { '--block-width': 'var(--layout-container-width)' },
    },
  ];

  const createEditor = (value: Value) =>
    createSlateEditor({
      plugins: [
        ...BaseBasicBlocksKit,
        ...BaseCalloutKit,
        BaseStyleFieldsPlugin,
        BaseBlockWidthPlugin,
      ],
      value,
    });

  const save = (editor: { children: Value }) =>
    JSON.parse(JSON.stringify(editor.children)) as Value;

  const reload = (value: Value) =>
    save(createEditor(JSON.parse(JSON.stringify(value))));

  const topLevelWidths = (value: Value) =>
    value.map((node) => [node.type, node.blockWidth]);

  beforeEach(() => {
    registryBlocks.widths = widths;
    // Only `p` is registered, like in add-ons that configure a few blocks.
    registryBlocks.plateBlocksConfig = {
      p: { blockWidth: { defaultWidth: 'default' } },
    };
    registryBlocks.blocksConfig = {
      teaser: {
        defaultBlockWidth: 'layout',
        blockSchema: {
          title: 'Teaser',
          fieldsets: [],
          required: [],
          properties: {},
        },
      },
    };
  });

  it('stores the default width of every top-level block, however it got there', () => {
    const editor = createEditor([
      { type: 'p', children: [{ text: 'Paragraph' }] },
      {
        type: 'callout',
        children: [{ type: 'h2', children: [{ text: 'Nested heading' }] }],
      },
      { type: 'p', children: [{ text: '' }] },
    ]);

    editor.tf.insertNodes(
      { type: 'h3', children: [{ text: 'Inserted' }] },
      { at: [3] },
    );
    editor.tf.select({ path: [2, 0], offset: 0 });
    editor.tf.insertFragment([
      { type: 'h4', children: [{ text: 'Pasted' }] },
      { type: 'blockquote', children: [{ text: 'Pasted quote' }] },
    ]);
    editor.tf.wrapNodes({ type: 'blockquote', children: [] }, { at: [0] });
    // Lifts the nested heading out of the callout.
    editor.tf.unwrapNodes({ at: [1] });

    const saved = save(editor);

    expect(topLevelWidths(saved)).toEqual([
      ['blockquote', 'default'],
      ['h2', 'default'],
      ['h4', 'default'],
      ['blockquote', 'default'],
      ['h3', 'default'],
    ]);
    expect(reload(saved)).toEqual(saved);
  });

  it('stores a non-default width and keeps it on reload', () => {
    registryBlocks.plateBlocksConfig = {
      p: { blockWidth: { defaultWidth: 'default' } },
      h2: { blockWidth: { widths: ['default', 'layout'] } },
      h3: { blockWidth: { widths: ['default', 'layout'] } },
    };
    const editor = createEditor([
      { type: 'p', children: [{ text: 'Paragraph' }] },
      { type: 'h2', children: [{ text: 'Heading' }] },
    ]);

    editor.tf.blockWidth.setWidth('narrow', { at: [0] });
    editor.tf.blockWidth.setWidth('layout', { at: [1] });
    // Changing the block type keeps a width the new type allows.
    editor.tf.setNodes({ type: 'h3' }, { at: [1] });

    const saved = save(editor);

    expect(topLevelWidths(saved)).toEqual([
      ['p', 'narrow'],
      ['h3', 'layout'],
    ]);
    expect(reload(saved)).toEqual(saved);

    editor.tf.blockWidth.resetWidth({ at: [0] });
    expect(save(editor)[0].blockWidth).toBe('default');
  });

  it('resets a width the block does not allow to its default', () => {
    const editor = createEditor([
      { type: 'p', blockWidth: 'narrow', children: [{ text: 'Paragraph' }] },
    ]);
    registryBlocks.plateBlocksConfig = {
      p: { blockWidth: { defaultWidth: 'default', widths: ['default'] } },
      h2: { blockWidth: { defaultWidth: 'layout', widths: ['layout'] } },
    };

    editor.tf.setNodes({ type: 'h2' }, { at: [0] });

    const saved = save(editor);

    expect(topLevelWidths(saved)).toEqual([['h2', 'layout']]);
    expect(reload(saved)).toEqual(saved);
  });

  it('stores the default width of inserted Plone blocks', () => {
    const editor = createEditor([
      { type: 'p', children: [{ text: 'Paragraph' }] },
    ]);

    editor.tf.insertNodes(
      {
        type: PLONE_BLOCK_TYPE,
        '@type': 'teaser',
        children: [{ text: '' }],
      },
      { at: [1] },
    );
    editor.tf.insertNodes(
      editor.api.create.block({ type: PLONE_BLOCK_TYPE, '@type': 'teaser' }),
      { at: [2] },
    );

    const saved = save(editor);

    expect(topLevelWidths(saved)).toEqual([
      ['p', 'default'],
      [PLONE_BLOCK_TYPE, 'layout'],
      [PLONE_BLOCK_TYPE, 'layout'],
    ]);
    expect(reload(saved)).toEqual(saved);
  });

  it('stores a non-default Plone block width and keeps it on reload', () => {
    const editor = createEditor([
      { type: PLONE_BLOCK_TYPE, '@type': 'teaser', children: [{ text: '' }] },
    ]);

    setStyleFieldOnEditor(editor, 'blockWidth', 'narrow', { at: [0] });

    const saved = save(editor);

    expect(topLevelWidths(saved)).toEqual([[PLONE_BLOCK_TYPE, 'narrow']]);
    expect(reload(saved)).toEqual(saved);
  });
});
