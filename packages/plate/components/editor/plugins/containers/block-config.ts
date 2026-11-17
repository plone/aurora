import config from '@plone/registry';
import type { BlockConfigBase } from '@plone/types';
import type { Path, SlateEditor } from 'platejs';

import { enhanceInnerBlockSchema } from './inner-block-schema';
import { getBlockContainer } from './registry';
import type { BlockSettingsSchema } from './types';

const getGlobalBlockConfig = (blockType: string) =>
  (
    config as unknown as {
      blocks?: { blocksConfig?: Record<string, BlockConfigBase> };
    }
  )?.blocks?.blocksConfig?.[blockType];

const resolveSchema = (
  schema: BlockConfigBase['blockSchema'],
  args: Record<string, unknown>,
): BlockSettingsSchema =>
  (typeof schema === 'function'
    ? (schema as (args: Record<string, unknown>) => unknown)(args)
    : schema) as BlockSettingsSchema;

/**
 * The config of a Plone block, as it applies at a path. Inside a container,
 * the container's overrides apply: its `blockSchema` goes through the
 * container's schema enhancers. Outside a container, or without `at`, it's
 * the global config.
 */
export const getBlockConfig = (
  editor: SlateEditor,
  blockType: string,
  { at }: { at?: Path } = {},
): BlockConfigBase | undefined => {
  const blockConfig = getGlobalBlockConfig(blockType);
  if (!blockConfig || !at) return blockConfig;
  if (!getBlockContainer(editor, at) || !blockConfig.blockSchema) {
    return blockConfig;
  }

  const blockSchema = blockConfig.blockSchema;
  return {
    ...blockConfig,
    blockSchema: ((args: Record<string, unknown>) =>
      enhanceInnerBlockSchema(
        editor,
        at,
        resolveSchema(blockSchema, args),
        blockType,
      )) as BlockConfigBase['blockSchema'],
  };
};
