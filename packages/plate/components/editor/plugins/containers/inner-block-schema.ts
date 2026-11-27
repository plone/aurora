import type { Path, SlateEditor } from 'platejs';

import { getTranslation } from '../i18n';
import { getBlockContainer } from './registry';
import type {
  BlockContainerEntry,
  BlockSettingsSchema,
  InnerBlockSchemaEnhancer,
} from './types';

/*
 * Blocks inside a container follow the container's layout, so some of their
 * own settings may not apply there. A host's block settings form runs a
 * block's schema through `enhanceInnerBlockSchema` before rendering it.
 */

/** Removes fields from a schema, and explains why in its description. */
export const withoutFields = (
  schema: BlockSettingsSchema,
  fields: string[],
  description: string,
): BlockSettingsSchema => {
  if (!fields.some((field) => field in (schema.properties ?? {}))) {
    return schema;
  }
  const properties = { ...schema.properties };
  for (const field of fields) delete properties[field];
  return {
    ...schema,
    description,
    fieldsets: schema.fieldsets.map((fieldset) => ({
      ...fieldset,
      fields: fieldset.fields.filter((field) => !fields.includes(field)),
    })),
    properties,
    required: (schema.required ?? []).filter(
      (field: string) => !fields.includes(field),
    ),
  };
};

/**
 * The schema enhancers a container applies to a block type: the one for
 * every block (`*`) first, then the block type's own.
 */
export const getInnerBlockSchemaEnhancers = (
  entry: BlockContainerEntry,
  blockType: string,
): InnerBlockSchemaEnhancer[] => {
  const blocksConfig = entry.spec.blocksConfig ?? {};
  return [blocksConfig['*'], blocksConfig[blockType]]
    .map((item) => item?.schemaEnhancer)
    .filter((item): item is InnerBlockSchemaEnhancer => !!item);
};

/**
 * Adapts the settings schema of the block at a path to the container it's
 * in, if any. Blocks outside a container keep their schema.
 */
export const enhanceInnerBlockSchema = (
  editor: SlateEditor,
  path: Path,
  schema: BlockSettingsSchema,
  blockType: string,
): BlockSettingsSchema => {
  const entry = getBlockContainer(editor, path);
  if (!entry) return schema;

  const { t } = getTranslation(editor);
  return getInnerBlockSchemaEnhancers(entry, blockType).reduce(
    (current, enhancer) =>
      enhancer(current, { blockType, container: entry.container[0], t }),
    schema,
  );
};
