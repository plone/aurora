import {
  CUSTOM_FIELD_BEHAVIOR,
  type SchemaField,
  type SchemaFieldset,
  type TypeSchema,
} from './types';

/**
 * Pure changes to a type schema, for the Fields tab. Each one returns a new
 * schema and leaves the one it gets alone. Only the type's own fields and
 * fieldsets change: the ones that behaviors add are read-only.
 */

/** The fieldset every type has. It can't be renamed or deleted. */
export const DEFAULT_FIELDSET = 'default';

const isCustom = (behavior: string | undefined) =>
  !!behavior?.startsWith(CUSTOM_FIELD_BEHAVIOR);

/** Whether the type itself adds the field, so it can be edited. */
export function isCustomField(field: SchemaField | undefined): boolean {
  return isCustom(field?.behavior);
}

/** Whether the type itself adds the fieldset, so it can be deleted. */
export function isCustomFieldset(fieldset: SchemaFieldset): boolean {
  return fieldset.id !== DEFAULT_FIELDSET && isCustom(fieldset.behavior);
}

/** Whether custom fields can go in a fieldset: the default one or a custom one. */
export function holdsCustomFields(fieldset: SchemaFieldset): boolean {
  return fieldset.id === DEFAULT_FIELDSET || isCustomFieldset(fieldset);
}

/** The fieldset a field is in. */
export function fieldsetOf(
  schema: TypeSchema,
  field: string,
): SchemaFieldset | undefined {
  return schema.fieldsets.find((fieldset) => fieldset.fields.includes(field));
}

/** Whether a short name is free for a new field or fieldset. */
export function isNameTaken(schema: TypeSchema, name: string): boolean {
  return (
    name in schema.properties ||
    schema.fieldsets.some((fieldset) => fieldset.id === name)
  );
}

export interface NewField {
  id: string;
  title: string;
  description?: string;
  /** A `FieldType` id. */
  factory: string;
  required?: boolean;
  /** Defaults to the default fieldset. */
  fieldset?: string;
}

export function addField(schema: TypeSchema, field: NewField): TypeSchema {
  const target = field.fieldset ?? DEFAULT_FIELDSET;
  return {
    ...schema,
    fieldsets: schema.fieldsets.map((fieldset) =>
      fieldset.id === target
        ? { ...fieldset, fields: [...fieldset.fields, field.id] }
        : fieldset,
    ),
    properties: {
      ...schema.properties,
      [field.id]: {
        title: field.title,
        description: field.description ?? '',
        factory: field.factory,
        behavior: CUSTOM_FIELD_BEHAVIOR,
      },
    },
    required: field.required ? [...schema.required, field.id] : schema.required,
  };
}

export interface FieldChanges {
  title?: string;
  description?: string;
  required?: boolean;
  /** Moves the field to the end of another fieldset. */
  fieldset?: string;
}

export function updateField(
  schema: TypeSchema,
  id: string,
  { title, description, required, fieldset }: FieldChanges,
): TypeSchema {
  const field = schema.properties[id];
  if (!isCustomField(field)) return schema;
  let next: TypeSchema = {
    ...schema,
    properties: {
      ...schema.properties,
      [id]: {
        ...field,
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    },
  };
  if (required !== undefined && required !== schema.required.includes(id)) {
    next = {
      ...next,
      required: required
        ? [...schema.required, id]
        : schema.required.filter((name) => name !== id),
    };
  }
  if (fieldset !== undefined && fieldset !== fieldsetOf(schema, id)?.id) {
    next = {
      ...next,
      fieldsets: next.fieldsets.map((entry) => {
        const fields = entry.fields.filter((name) => name !== id);
        return {
          ...entry,
          fields: entry.id === fieldset ? [...fields, id] : fields,
        };
      }),
    };
  }
  return next;
}

export function removeField(schema: TypeSchema, id: string): TypeSchema {
  if (!isCustomField(schema.properties[id])) return schema;
  const properties = { ...schema.properties };
  delete properties[id];
  return {
    ...schema,
    fieldsets: schema.fieldsets.map((fieldset) => ({
      ...fieldset,
      fields: fieldset.fields.filter((name) => name !== id),
    })),
    properties,
    required: schema.required.filter((name) => name !== id),
  };
}

/**
 * Moves custom fields before or after another field of the same fieldset.
 * Fields from behaviors keep their place.
 */
export function moveFields(
  schema: TypeSchema,
  ids: string[],
  target: string,
  position: 'before' | 'after',
): TypeSchema {
  const fieldset = fieldsetOf(schema, target);
  if (!fieldset) return schema;
  const moving = ids.filter(
    (id) =>
      id !== target &&
      fieldset.fields.includes(id) &&
      isCustomField(schema.properties[id]),
  );
  if (!moving.length) return schema;
  const rest = fieldset.fields.filter((name) => !moving.includes(name));
  const index = rest.indexOf(target) + (position === 'after' ? 1 : 0);
  const fields = [...rest.slice(0, index), ...moving, ...rest.slice(index)];
  return {
    ...schema,
    fieldsets: schema.fieldsets.map((entry) =>
      entry.id === fieldset.id ? { ...entry, fields } : entry,
    ),
  };
}

export function addFieldset(
  schema: TypeSchema,
  { id, title }: { id: string; title: string },
): TypeSchema {
  return {
    ...schema,
    fieldsets: [
      ...schema.fieldsets,
      {
        id,
        title,
        description: '',
        behavior: CUSTOM_FIELD_BEHAVIOR,
        fields: [],
      },
    ],
  };
}

/** Whether a fieldset can be deleted: a custom one without fields. */
export function canRemoveFieldset(fieldset: SchemaFieldset): boolean {
  return isCustomFieldset(fieldset) && fieldset.fields.length === 0;
}

export function removeFieldset(schema: TypeSchema, id: string): TypeSchema {
  const fieldset = schema.fieldsets.find((entry) => entry.id === id);
  if (!fieldset || !canRemoveFieldset(fieldset)) return schema;
  return {
    ...schema,
    fieldsets: schema.fieldsets.filter((entry) => entry.id !== id),
  };
}

/** Moves fieldsets before or after another one. The default one stays first. */
export function moveFieldsets(
  schema: TypeSchema,
  ids: string[],
  target: string,
  position: 'before' | 'after',
): TypeSchema {
  const moving = schema.fieldsets.filter(
    (fieldset) =>
      ids.includes(fieldset.id) &&
      fieldset.id !== target &&
      fieldset.id !== DEFAULT_FIELDSET,
  );
  if (!moving.length) return schema;
  const rest = schema.fieldsets.filter(
    (fieldset) => !moving.includes(fieldset),
  );
  let index =
    rest.findIndex((fieldset) => fieldset.id === target) +
    (position === 'after' ? 1 : 0);
  if (rest[0]?.id === DEFAULT_FIELDSET) index = Math.max(index, 1);
  return {
    ...schema,
    fieldsets: [...rest.slice(0, index), ...moving, ...rest.slice(index)],
  };
}
