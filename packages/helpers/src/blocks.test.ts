import { describe, expect, it } from 'vitest';
import type { BlockConfigBase, JSONSchema } from '@plone/types';
import { applySchemaEnhancer } from './blocks';

const schema = (): JSONSchema =>
  ({
    title: 'Block',
    fieldsets: [{ id: 'default', title: 'Default', fields: ['url'] }],
    properties: { url: { title: 'URL' } },
    required: [],
  }) as unknown as JSONSchema;

const addField =
  (name: string) =>
  ({ schema }: { schema: JSONSchema }) => {
    (schema as any).fieldsets[0].fields.push(name);
    (schema as any).properties[name] = { title: name };
    return schema;
  };

describe('applySchemaEnhancer', () => {
  it('returns the schema when the block has no enhancers', () => {
    const original = schema();
    const result = applySchemaEnhancer({
      schema: original,
      formData: { '@type': 'image' },
      blocksConfig: { image: { id: 'image' } as BlockConfigBase },
    });
    expect(result).toBe(original);
  });

  it("applies the block's schemaEnhancer to a copy", () => {
    const original = schema();
    const result = applySchemaEnhancer({
      schema: original,
      formData: { '@type': 'image' },
      blocksConfig: {
        image: { id: 'image', schemaEnhancer: addField('alt') } as any,
      },
    });
    expect((result as any).fieldsets[0].fields).toEqual(['url', 'alt']);
    expect((original as any).fieldsets[0].fields).toEqual(['url']);
  });

  it('applies the selected variation, then the block enhancer', () => {
    const blocksConfig = {
      listing: {
        id: 'listing',
        variations: [
          { id: 'default', title: 'Default', isDefault: true },
          {
            id: 'summary',
            title: 'Summary',
            schemaEnhancer: addField('summary'),
          },
        ],
        schemaEnhancer: addField('headline'),
      } as any,
    };

    const summary = applySchemaEnhancer({
      schema: schema(),
      formData: { '@type': 'listing', variation: 'summary' },
      blocksConfig,
    });
    expect((summary as any).fieldsets[0].fields).toEqual([
      'url',
      'summary',
      'headline',
    ]);

    const fallback = applySchemaEnhancer({
      schema: schema(),
      formData: { '@type': 'listing', variation: 'unknown' },
      blocksConfig,
    });
    expect((fallback as any).fieldsets[0].fields).toEqual(['url', 'headline']);
  });

  it('uses the default variation when none is selected', () => {
    const result = applySchemaEnhancer({
      schema: schema(),
      formData: { '@type': 'listing' },
      blocksConfig: {
        listing: {
          id: 'listing',
          variations: [
            {
              id: 'grid',
              title: 'Grid',
              isDefault: true,
              schemaEnhancer: addField('columns'),
            },
          ],
        } as any,
      },
    });
    expect((result as any).fieldsets[0].fields).toEqual(['url', 'columns']);
  });

  it('keeps functions in the schema', () => {
    const validator = () => null;
    const original = schema();
    (original as any).properties.url.validator = validator;
    const result = applySchemaEnhancer({
      schema: original,
      formData: { '@type': 'image' },
      blocksConfig: {
        image: { id: 'image', schemaEnhancer: addField('alt') } as any,
      },
    });
    expect((result as any).properties.url.validator).toBe(validator);
  });
});
