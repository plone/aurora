import config from '@plone/registry';
import {
  getStyleFieldsFromBlockSchema,
  PLONE_BLOCK_TYPE,
} from '@plone/helpers';
import type { BlockConfigBase, BlocksFormData } from '@plone/types';
import {
  migrateLegacyBlockquotesInValue,
  migrateLegacyBoldInValue,
  migrateLegacyBlockWidthsInValue,
  migrateLegacyItalicInValue,
  migrateLegacyLinksInValueStatic,
  migrateLegacyListsInValue,
  migrateLegacyStrikethroughInValue,
} from '@plone/plate/migrations';
import {
  MAIN_REGION,
  PLATE_TYPE,
  SOMERSAULT_KEY,
} from '@plone/plate/constants';
import type {
  ContentMigrationArgs,
  SomersaultBlockMigrationArgs,
  SomersaultMigrationArgs,
} from '../types';

const isRegisteredNativeBlock = (block: Record<string, unknown>) => {
  const blockType = block['@type'];
  if (typeof blockType !== 'string') return false;

  const blocksConfig = config.blocks?.blocksConfig as
    Record<string, unknown> | undefined;

  return Boolean(blocksConfig?.[blockType]);
};

const DEFAULT_BLOCK_WIDTH = 'default';

const getMigratedPloneBlockWidth = (block: Record<string, unknown>) => {
  const blockType = block['@type'];

  if (typeof blockType !== 'string') {
    return DEFAULT_BLOCK_WIDTH;
  }

  const blocksConfig = config.blocks?.blocksConfig as
    Record<string, BlockConfigBase> | undefined;
  const blockConfig = blocksConfig?.[blockType];
  const styleFields = getStyleFieldsFromBlockSchema(
    blockConfig,
    block as BlocksFormData,
  );

  return (
    styleFields.blockWidth?.defaultValue ??
    blockConfig?.defaultBlockWidth ??
    DEFAULT_BLOCK_WIDTH
  );
};

/**
 * Renames the `__somersault__` block, stored before the page body became a
 * region, to the `main` region with the `plate` type. The editor saves the
 * whole `blocks` field, so a page keeps the new shape once it is edited.
 * If the content has both, `main` wins and the legacy block is dropped.
 *
 * Remove at Plone 7 final, see https://github.com/plone/aurora/issues/379.
 */
export const migrateSomersaultRegion = ({ content }: ContentMigrationArgs) => {
  const blocks = content.blocks as Record<string, unknown> | undefined;
  if (!blocks || !Object.hasOwn(blocks, SOMERSAULT_KEY)) return;

  const legacy = blocks[SOMERSAULT_KEY] as Record<string, unknown> | undefined;
  delete blocks[SOMERSAULT_KEY];
  // Regions stay out of `blocks_layout`, but some content lists the legacy
  // block there.
  const items = content.blocks_layout?.items;
  if (Array.isArray(items) && items.includes(SOMERSAULT_KEY)) {
    content.blocks_layout.items = items.filter((id) => id !== SOMERSAULT_KEY);
  }
  if (blocks[MAIN_REGION] || !legacy) return;

  blocks[MAIN_REGION] = { ...legacy, '@type': PLATE_TYPE };
};

export default function install() {
  config.registerUtility({
    name: 'contentMigrationSomersaultRegion',
    type: 'contentMigration',
    method: migrateSomersaultRegion,
  });

  config.registerUtility({
    name: 'somersaultBlockMigrationTitle',
    type: 'somersaultBlockMigration',
    method: ({ block, content }: SomersaultBlockMigrationArgs) =>
      block['@type'] === 'title'
        ? [
            {
              type: 'title',
              children: [
                {
                  text: typeof content.title === 'string' ? content.title : '',
                },
              ],
            },
          ]
        : [],
  });

  config.registerUtility({
    name: 'somersaultBlockMigrationLegacyValue',
    type: 'somersaultBlockMigration',
    method: ({ block }: SomersaultBlockMigrationArgs) =>
      Array.isArray(block.value) ? block.value : [],
  });

  config.registerUtility({
    name: 'somersaultBlockMigrationUnknown',
    type: 'somersaultBlockMigration',
    method: ({ block }: SomersaultBlockMigrationArgs) =>
      isRegisteredNativeBlock(block) && !Array.isArray(block.value)
        ? [
            {
              ...block,
              blockWidth: getMigratedPloneBlockWidth(block),
              type: PLONE_BLOCK_TYPE,
              children: [{ text: '' }],
            },
          ]
        : [],
  });

  config.registerUtility({
    name: 'somersaultMigrationLegacyBold',
    type: 'somersaultMigration',
    method: ({ value }: SomersaultMigrationArgs) =>
      migrateLegacyBoldInValue(value),
  });

  config.registerUtility({
    name: 'somersaultMigrationLegacyItalic',
    type: 'somersaultMigration',
    method: ({ value }: SomersaultMigrationArgs) =>
      migrateLegacyItalicInValue(value),
  });

  config.registerUtility({
    name: 'somersaultMigrationLegacyStrikethrough',
    type: 'somersaultMigration',
    method: ({ value }: SomersaultMigrationArgs) =>
      migrateLegacyStrikethroughInValue(value),
  });

  config.registerUtility({
    name: 'somersaultMigrationLegacyLinks',
    type: 'somersaultMigration',
    method: ({ value }: SomersaultMigrationArgs) =>
      migrateLegacyLinksInValueStatic(value),
  });

  config.registerUtility({
    name: 'somersaultMigrationLegacyLists',
    type: 'somersaultMigration',
    method: ({ value }: SomersaultMigrationArgs) =>
      migrateLegacyListsInValue(value),
  });

  config.registerUtility({
    name: 'somersaultMigrationLegacyBlockquotes',
    type: 'somersaultMigration',
    method: ({ value }: SomersaultMigrationArgs) =>
      migrateLegacyBlockquotesInValue(value),
  });

  config.registerUtility({
    name: 'somersaultMigrationBlockWidths',
    type: 'somersaultMigration',
    method: ({ value }: SomersaultMigrationArgs) =>
      migrateLegacyBlockWidthsInValue(value),
  });
}
