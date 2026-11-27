import config from '@plone/registry';
import type { Value } from '@plone/plate/components/editor';
import type { Content } from '@plone/types';
import '../types';
import { MAIN_REGION, PLATE_TYPE } from '@plone/plate/constants';

type SomersaultValue = Value;

const createSomersaultValue = (content: Content): SomersaultValue => {
  const orderedBlockIds = Array.isArray(content.blocks_layout?.items)
    ? content.blocks_layout.items
    : [];
  const somersaultBlockMigrations = config.getUtilities({
    type: 'somersaultBlockMigration',
  });

  return orderedBlockIds.flatMap((blockId) => {
    const block = content.blocks?.[blockId] as
      Record<string, unknown> | undefined;
    if (!block) return [];

    return somersaultBlockMigrations.flatMap(
      (utility) =>
        utility.method({
          block,
          blockId,
          content,
        }) as SomersaultValue,
    );
  });
};

/**
 * Brings content to the shape the editor and the renderer expect, in place.
 *
 * 1. The `contentMigration` utilities run first, in registration order, over
 *    the whole content. They upgrade content stored in an older shape, for
 *    example the `__somersault__` block, which becomes the `main` region.
 * 2. If the content has no `main` region yet, it is built from the legacy
 *    blocks by the `somersaultBlockMigration` utilities, then normalized by
 *    the `somersaultMigration` utilities.
 *
 * Returns the same, mutated, content object.
 */
export const migrateContent = (content: Content) => {
  const contentMigrations = config.getUtilities({
    type: 'contentMigration',
  });
  for (const utility of contentMigrations) {
    utility.method({ content });
  }

  if (content.blocks?.[MAIN_REGION]) return content;
  if (!content.blocks || !Array.isArray(content.blocks_layout?.items)) {
    return content;
  }

  const somersaultMigrations = config.getUtilities({
    type: 'somersaultMigration',
  });

  const initialValue = createSomersaultValue(content);
  const migratedValue = somersaultMigrations.reduce<SomersaultValue>(
    (value, utility) =>
      utility.method({
        content,
        value,
      }) as SomersaultValue,
    initialValue,
  );

  content.blocks[MAIN_REGION] = {
    '@type': PLATE_TYPE,
    value: migratedValue,
  } as (typeof content.blocks)[string];

  return content;
};
