import { describe, expect, it } from 'vitest';
import {
  addField,
  addFieldset,
  fieldsetOf,
  isCustomField,
  isNameTaken,
  moveFields,
  moveFieldsets,
  removeField,
  removeFieldset,
  updateField,
} from './schemaEditing';
import type { TypeSchema } from './types';

const GENERATED = 'plone.dexterity.schema.generated';

const schema: TypeSchema = {
  title: 'Event',
  type: 'object',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      behavior: 'plone',
      fields: ['title', 'start', 'pages', 'flag'],
    },
    {
      id: 'dates',
      title: 'Dates',
      behavior: 'plone',
      fields: ['effective'],
    },
    {
      id: 'extra',
      title: 'Extra',
      behavior: GENERATED,
      fields: [],
    },
  ],
  properties: {
    title: { title: 'Title', behavior: 'plone.dublincore' },
    start: { title: 'Start', behavior: 'plone.eventbasic' },
    effective: { title: 'Publishing date', behavior: 'plone.dublincore' },
    // plone.restapi adds a suffix to the behavior of custom fields.
    pages: { title: 'Pages', behavior: `${GENERATED}.plone_5_123_0_Event` },
    flag: { title: 'Flag', behavior: GENERATED },
  },
  required: ['title', 'pages'],
};

const fields = (result: TypeSchema, fieldset = 'default') =>
  result.fieldsets.find((entry) => entry.id === fieldset)?.fields;

describe('schemaEditing', () => {
  it('tells custom fields from behavior fields', () => {
    expect(isCustomField(schema.properties.pages)).toBe(true);
    expect(isCustomField(schema.properties.flag)).toBe(true);
    expect(isCustomField(schema.properties.title)).toBe(false);
  });

  it('knows which names are taken', () => {
    expect(isNameTaken(schema, 'pages')).toBe(true);
    expect(isNameTaken(schema, 'dates')).toBe(true);
    expect(isNameTaken(schema, 'summary')).toBe(false);
  });

  it('adds a field at the end of a fieldset', () => {
    const result = addField(schema, {
      id: 'summary',
      title: 'Summary',
      factory: 'Text',
      required: true,
      fieldset: 'extra',
    });
    expect(fields(result, 'extra')).toEqual(['summary']);
    expect(result.properties.summary).toMatchObject({
      title: 'Summary',
      factory: 'Text',
      behavior: GENERATED,
    });
    expect(result.required).toContain('summary');
    expect(schema.properties.summary).toBeUndefined();
  });

  it('changes a custom field, and leaves behavior fields alone', () => {
    const result = updateField(schema, 'pages', {
      title: 'Page count',
      required: false,
      fieldset: 'extra',
    });
    expect(result.properties.pages.title).toBe('Page count');
    expect(result.required).toEqual(['title']);
    expect(fieldsetOf(result, 'pages')?.id).toBe('extra');
    expect(fields(result)).toEqual(['title', 'start', 'flag']);
    expect(updateField(schema, 'title', { title: 'Name' })).toBe(schema);
  });

  it('removes only custom fields', () => {
    const result = removeField(schema, 'pages');
    expect(result.properties.pages).toBeUndefined();
    expect(result.required).toEqual(['title']);
    expect(fields(result)).toEqual(['title', 'start', 'flag']);
    expect(removeField(schema, 'start')).toBe(schema);
  });

  it('moves custom fields within their fieldset', () => {
    expect(fields(moveFields(schema, ['flag'], 'pages', 'before'))).toEqual([
      'title',
      'start',
      'flag',
      'pages',
    ]);
    expect(fields(moveFields(schema, ['pages'], 'flag', 'after'))).toEqual([
      'title',
      'start',
      'flag',
      'pages',
    ]);
    // Behavior fields don't move.
    expect(moveFields(schema, ['start'], 'flag', 'after')).toBe(schema);
  });

  it('adds and removes custom fieldsets', () => {
    const added = addFieldset(schema, { id: 'more', title: 'More' });
    expect(added.fieldsets.at(-1)).toMatchObject({
      id: 'more',
      behavior: GENERATED,
      fields: [],
    });
    expect(removeFieldset(added, 'more').fieldsets).toHaveLength(3);
    // Behavior fieldsets and fieldsets with fields stay.
    expect(removeFieldset(schema, 'dates')).toBe(schema);
    const filled = updateField(schema, 'flag', { fieldset: 'extra' });
    expect(removeFieldset(filled, 'extra')).toBe(filled);
  });

  it('moves fieldsets, keeping the default one first', () => {
    const order = (result: TypeSchema) =>
      result.fieldsets.map((fieldset) => fieldset.id);
    expect(order(moveFieldsets(schema, ['extra'], 'dates', 'before'))).toEqual([
      'default',
      'extra',
      'dates',
    ]);
    expect(
      order(moveFieldsets(schema, ['extra'], 'default', 'before')),
    ).toEqual(['default', 'extra', 'dates']);
    expect(moveFieldsets(schema, ['default'], 'extra', 'after')).toBe(schema);
  });
});
