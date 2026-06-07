import { afterEach, describe, expect, it } from 'vitest';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';

import { BaseBlockAnatomyPlugin } from './block-anatomy-plugin';

type RegistryBlocksState = {
  plateBlocksConfig?: unknown;
  blocksConfig?: unknown;
};

type TransformPropsFn = (args: {
  element?: Record<string, unknown>;
  props: {
    className?: string;
  };
}) => {
  className?: string;
  'data-block-type'?: string;
  'data-block-category'?: string;
};

const registryBlocks = config.blocks as Record<string, unknown>;

const snapshotRegistryState = (): RegistryBlocksState => ({
  plateBlocksConfig: registryBlocks.plateBlocksConfig,
  blocksConfig: registryBlocks.blocksConfig,
});

const restoreRegistryState = (state: RegistryBlocksState) => {
  registryBlocks.plateBlocksConfig = state.plateBlocksConfig;
  registryBlocks.blocksConfig = state.blocksConfig;
};

const initialRegistryState = snapshotRegistryState();

afterEach(() => {
  restoreRegistryState(initialRegistryState);
});

describe('BlockAnatomyPlugin', () => {
  it('injects block anatomy classes for Plate-native blocks', () => {
    registryBlocks.plateBlocksConfig = {
      p: {
        category: 'text',
      },
    };

    const transformProps = (BaseBlockAnatomyPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        element: {
          type: 'p',
          children: [{ text: 'Paragraph' }],
        },
        props: {
          className: 'existing',
        },
      }),
    ).toEqual({
      className: 'existing block block-p category-text',
      'data-block-type': 'p',
      'data-block-category': 'text',
    });
  });

  it('injects block anatomy classes for registry-backed Plone blocks', () => {
    registryBlocks.blocksConfig = {
      image: {
        category: 'media',
      },
    };

    const transformProps = (BaseBlockAnatomyPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        element: {
          type: PLONE_BLOCK_TYPE,
          '@type': 'image',
          children: [{ text: '' }],
        },
        props: {},
      }),
    ).toEqual({
      className: 'block block-image category-media',
      'data-block-type': 'image',
      'data-block-category': 'media',
    });
  });

  it('does not inject anatomy classes for unconfigured Plate internals', () => {
    registryBlocks.plateBlocksConfig = {
      p: {
        category: 'text',
      },
    };

    const transformProps = (BaseBlockAnatomyPlugin as any).inject.nodeProps
      .transformProps as TransformPropsFn;

    expect(
      transformProps({
        element: {
          type: 'td',
          children: [{ text: 'Cell' }],
        },
        props: {
          className: 'table-cell',
        },
      }),
    ).toEqual({
      className: 'table-cell',
    });
  });
});
