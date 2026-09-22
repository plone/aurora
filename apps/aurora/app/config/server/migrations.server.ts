import config from '@plone/registry';
import {
  getStyleFieldsFromBlockSchema,
  PLONE_BLOCK_TYPE,
} from '@plone/helpers';
import type { BlockConfigBase, BlocksFormData } from '@plone/types';
import {
  migrateLegacyBoldInValue,
  migrateLegacyBlockWidthsInValue,
  migrateLegacyItalicInValue,
  migrateLegacyLinksInValueStatic,
  migrateLegacyListsInValue,
  migrateLegacyStrikethroughInValue,
} from '@plone/plate/migrations';
import type {
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

export default function install() {
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
    name: 'somersaultMigrationBlockWidths',
    type: 'somersaultMigration',
    method: ({ value }: SomersaultMigrationArgs) =>
      migrateLegacyBlockWidthsInValue(value),
  });
}
