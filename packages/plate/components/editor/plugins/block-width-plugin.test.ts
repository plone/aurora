import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';

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
      style: {
        color: 'red',
        '--block-width': 'var(--layout-container-width)',
      },
    });
  });

  it('adds the baseline default blockWidth when creating ploneBlock nodes without schema style fields', () => {
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
    const insertNodes = vi.fn();
    const editor = {
      api: {
        create: {
          block: vi.fn(() => node),
        },
      },
      tf: {
        insertNodes,
      },
    } as any;

    const extendedEditor = (BaseStyleFieldsPlugin as any).extendEditor({
      editor,
    });

    expect(extendedEditor.api.create.block()).toEqual({
      ...node,
      blockWidth: 'default',
    });

    extendedEditor.tf.insertNodes(node, { at: [0] });

    expect(insertNodes).toHaveBeenCalledWith(
      {
        ...node,
        blockWidth: 'default',
      },
      { at: [0] },
    );
  });

  it('does not add style field defaults to nested inserted ploneBlock descendants', () => {
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
      },
    } as any;
    const insertNodes = editor.tf.insertNodes;

    const extendedEditor = (BaseStyleFieldsPlugin as any).extendEditor({
      editor,
    });

    expect(extendedEditor.api.create.block()).toEqual({
      ...node,
      blockWidth: 'default',
    });

    extendedEditor.tf.insertNodes(node, { at: [0] });

    expect(insertNodes).toHaveBeenCalledWith(
      {
        ...node,
        blockWidth: 'default',
      },
      { at: [0] },
    );
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

  it('adds block width defaults only to inserted top-level native Plate blocks', () => {
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
      },
    } as any;
    const insertNodes = editor.tf.insertNodes;

    const extendedEditor = (BaseBlockWidthPlugin as any).extendEditor({
      editor,
    });

    expect(extendedEditor.api.create.block()).toEqual({
      ...node,
      blockWidth: 'layout',
    });

    extendedEditor.tf.insertNodes(node, { at: [0] });

    expect(insertNodes).toHaveBeenCalledWith(
      {
        ...node,
        blockWidth: 'layout',
      },
      { at: [0] },
    );
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
