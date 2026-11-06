import type { JSONSchema } from '@plone/types';
import type { Path, SlateEditor } from 'platejs';

import { getTranslation, type TranslateFunction } from '../i18n';
import { ACCORDION_KEY, ACCORDION_PANEL_CONTENT_KEY } from './types';

/*
 * Blocks inside an accordion follow the accordion's layout, so some of their
 * own settings don't apply there. A host's block settings form runs a block's
 * schema through `enhanceInnerBlockSchema` before rendering it.
 */

/** A block settings schema, with an optional note shown above its fields. */
export type BlockSettingsSchema = JSONSchema & { description?: string };

export type InnerBlockSchemaEnhancer = (
  schema: BlockSettingsSchema,
  context: { blockType: string; t: TranslateFunction },
) => BlockSettingsSchema;

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
 * The accordion's rules: an Image uses the panel's full width, so its width,
 * size and alignment aren't offered; a Teaser takes the accordion's
 * background, so its own background isn't offered.
 */
export const defaultInnerBlockSchemaEnhancer: InnerBlockSchemaEnhancer = (
  schema,
  { blockType, t },
) => {
  if (blockType === 'image') {
    return withoutFields(
      schema,
      ['blockWidth', 'align', 'size'],
      t('plate.accordion.innerImageNote', {
        defaultValue:
          "Inside an accordion, images always use the panel's full width, so size and alignment aren't offered.",
      }),
    );
  }
  if (blockType === 'teaser') {
    return withoutFields(
      schema,
      ['theme'],
      t('plate.accordion.innerTeaserNote', {
        defaultValue:
          "Inside an accordion, a teaser takes the accordion's background, so its own background isn't offered.",
      }),
    );
  }
  return schema;
};

/**
 * Adapts the settings schema of a block to the accordion it's in, if any.
 * Blocks outside an accordion keep their schema.
 */
export const enhanceInnerBlockSchema = (
  editor: SlateEditor,
  path: Path,
  schema: BlockSettingsSchema,
  blockType: string,
): BlockSettingsSchema => {
  const content = editor.api.above({
    at: path,
    match: { type: ACCORDION_PANEL_CONTENT_KEY },
  });
  if (!content) return schema;

  let enhancer: InnerBlockSchemaEnhancer | undefined;
  try {
    enhancer = editor.getOptions({ key: ACCORDION_KEY })
      ?.innerBlockSchemaEnhancer as InnerBlockSchemaEnhancer | undefined;
  } catch {
    // The editor has no accordion plugin.
  }

  return (enhancer ?? defaultInnerBlockSchemaEnhancer)(schema, {
    blockType,
    t: getTranslation(editor).t,
  });
};
