import {
  withoutFields,
  type BlockSettingsSchema,
  type InnerBlockSchemaEnhancer,
} from '../containers';

export {
  enhanceInnerBlockSchema,
  withoutFields,
  type BlockSettingsSchema,
  type InnerBlockSchemaEnhancer,
} from '../containers';

/*
 * Blocks inside an accordion follow the accordion's layout, so some of their
 * own settings don't apply there. These are the accordion's default rules;
 * the `innerBlockSchemaEnhancer` option replaces them.
 */

/**
 * The accordion's rules: an Image uses the panel's full width, so its width,
 * size and alignment aren't offered; a Teaser takes the accordion's
 * background, so its own background isn't offered.
 */
export const defaultInnerBlockSchemaEnhancer: InnerBlockSchemaEnhancer = (
  schema: BlockSettingsSchema,
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
