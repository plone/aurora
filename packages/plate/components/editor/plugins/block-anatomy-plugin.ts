import { PLONE_BLOCK_TYPE, resolveBlockAnatomy } from '@plone/helpers';
import config from '@plone/registry';
import type { BlockConfigBase, PlateBlockConfigBase } from '@plone/types';
import { createSlatePlugin, ElementApi, type TElement } from 'platejs';
import { toPlatePlugin } from 'platejs/react';

export const BLOCK_ANATOMY_KEY = 'blockAnatomy';

type BlockAnatomyElement = TElement & {
  '@type'?: unknown;
};

const getElementBlockType = (element: TElement) => {
  if (element.type === PLONE_BLOCK_TYPE) {
    const blockType = (element as BlockAnatomyElement)['@type'];
    return typeof blockType === 'string' ? blockType : undefined;
  }

  return typeof element.type === 'string' ? element.type : undefined;
};

const getElementAnatomyConfig = (element: TElement, blockType?: string) => {
  if (element.type === PLONE_BLOCK_TYPE) {
    if (!blockType) return undefined;

    const blocksConfig = (config.blocks as Record<string, unknown>)
      .blocksConfig as Record<string, BlockConfigBase> | undefined;

    return {
      category: blocksConfig?.[blockType]?.category,
      type: blockType,
    };
  }

  if (!blockType) return undefined;

  const plateBlocksConfig = (config.blocks as Record<string, unknown>)
    .plateBlocksConfig as Record<string, PlateBlockConfigBase> | undefined;
  const blockConfig = plateBlocksConfig?.[blockType];

  if (!blockConfig) return undefined;

  return {
    category: blockConfig.category,
    type: blockType,
  };
};

export const BaseBlockAnatomyPlugin = createSlatePlugin({
  key: BLOCK_ANATOMY_KEY,
  inject: {
    isBlock: true,
    nodeProps: {
      transformProps: ({ element, props }) => {
        if (!element || !ElementApi.isElement(element)) {
          return props;
        }

        const blockType = getElementBlockType(element);
        const blockConfig = getElementAnatomyConfig(element, blockType);

        if (!blockConfig) return props;

        const anatomy = resolveBlockAnatomy({
          type: blockConfig.type,
          category: blockConfig.category,
        });

        return {
          ...props,
          ...anatomy.dataAttributes,
          className: [props.className, anatomy.className]
            .filter((value): value is string => !!value)
            .join(' '),
        };
      },
    },
  },
});

export const BlockAnatomyPlugin = toPlatePlugin(BaseBlockAnatomyPlugin);
