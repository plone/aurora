import { describe, expect, it, vi } from 'vitest';
import type { BlockConfigBase, JSONSchema } from '@plone/types';
import { applySchemaEnhancer, isBlockRestricted } from './blocks';

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

describe('isBlockRestricted', () => {
  it('reads a boolean', () => {
    expect(isBlockRestricted({ restricted: true })).toBe(true);
    expect(isBlockRestricted({ restricted: false })).toBe(false);
    expect(isBlockRestricted({} as any)).toBe(false);
  });

  it('calls a function with the context and the block', () => {
    const restricted = vi.fn(({ contentType }) => contentType === 'Event');
    const block = { id: 'teaser', restricted };
    const context = {
      properties: { '@id': '/page' } as any,
      navRoot: { '@id': '/' } as any,
      contentType: 'Event',
      user: { id: 'admin' } as any,
    };

    expect(isBlockRestricted(block, context)).toBe(true);
    expect(restricted).toHaveBeenCalledWith({ ...context, block });
    expect(isBlockRestricted(block, { contentType: 'Document' })).toBe(false);
  });
});

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
