import type {
  BlockConfigBase,
  BlocksFormData,
  Content,
  JSONSchema,
  SchemaEnhancerArgs,
} from '@plone/types';

export function hasBlocksData(content: Content) {
  return (
    Object.keys(content).find(
      (key) => key !== 'volto.blocks' && key.endsWith('blocks'),
    ) !== undefined
  );
}

// Schemas may hold functions (validators, side effects) and components, so
// they are cloned by hand: plain objects and arrays are copied, anything else
// is kept as it is.
function cloneSchema<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneSchema) as T;
  if (value && typeof value === 'object' && !('$$typeof' in value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneSchema(item)]),
    ) as T;
  }
  return value;
}

/**
 * Applies the schema enhancers of a block to its schema, like its settings
 * form does: the enhancer of the selected variation (or of the default one,
 * if none is selected), then the block's own `schemaEnhancer`. The original
 * schema is not changed.
 */
export function applySchemaEnhancer({
  schema,
  formData,
  blocksConfig,
  intl,
  navRoot,
  contentType,
}: {
  schema: JSONSchema;
  formData: BlocksFormData;
  blocksConfig: Partial<Record<string, BlockConfigBase>>;
  intl?: SchemaEnhancerArgs['intl'];
  navRoot?: Content;
  contentType?: string;
}): JSONSchema {
  const blockConfig = blocksConfig[formData['@type']];
  const variations = blockConfig?.variations ?? [];
  const args = { formData, intl, navRoot, contentType };

  let enhanced = schema;
  if (variations.length > 0) {
    const variation =
      variations.find((item) => item.id === formData.variation) ??
      variations.find((item) => item.isDefault);
    enhanced = variation?.schemaEnhancer
      ? variation.schemaEnhancer({ schema: cloneSchema(schema), ...args })
      : cloneSchema(schema);
  }

  if (blockConfig?.schemaEnhancer) {
    enhanced = blockConfig.schemaEnhancer({
      schema: enhanced === schema ? cloneSchema(schema) : enhanced,
      ...args,
    });
  }

  return enhanced || schema;
}
