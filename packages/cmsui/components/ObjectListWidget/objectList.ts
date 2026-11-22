// The entries of the object list widget, as plain functions: how the item
// schema is found, how items are keyed and moved, and how an item is named
// and summarized. Nothing here depends on React.
import config from '@plone/registry';
import type { FieldSchema } from '@plone/types';

/** One item of the list: a record of the item schema's fields. */
export type ObjectListItem = Record<string, unknown> & { '@id'?: string };

/** What one item is, in the shape the forms read. */
export type ItemSchema = {
  /** Names one item, such as "Link". Used by the add button and dialogs. */
  title?: string;
  /** Overrides the add button's text, as in Volto. */
  addMessage?: string;
  fieldsets: Array<{ id: string; title: string; fields: string[] }>;
  properties: Record<string, FieldSchema>;
  required?: string[];
};

/**
 * The item schema, or a function that builds it from the widget's props, as
 * Volto's `object_list` widget accepts it.
 */
export type ItemSchemaSource =
  ItemSchema | ((props: Record<string, unknown>) => ItemSchema);

/** Enhances the item schema for one item, for example from its own values. */
export type ItemSchemaEnhancer = (args: {
  schema: ItemSchema;
  formData: ObjectListItem;
  t: (key: string, options?: Record<string, unknown>) => string;
}) => ItemSchema;

/** The schema with no fields, for a list whose item schema can't be found. */
export const EMPTY_ITEM_SCHEMA: ItemSchema = {
  fieldsets: [{ id: 'default', title: 'Default', fields: [] }],
  properties: {},
  required: [],
};

const isItemSchema = (schema: unknown): schema is ItemSchema =>
  !!schema &&
  typeof schema === 'object' &&
  Array.isArray((schema as ItemSchema).fieldsets) &&
  !!(schema as ItemSchema).properties;

/**
 * Where the item schema comes from, in a widget's `schema` prop.
 *
 * The form passes the field's own schema as `schema`, so in a block schema
 * the item schema is the field's `schema` key, as in Volto. Widget props from
 * the tagged values (`frontendOptions.widgetProps`) come last, so a content
 * type can pass the item schema itself as `schema`.
 */
const schemaSource = (schema: unknown): ItemSchemaSource | undefined => {
  if (typeof schema === 'function') return schema as ItemSchemaSource;
  if (isItemSchema(schema)) return schema;
  if (schema && typeof schema === 'object' && 'schema' in schema) {
    return (schema as { schema?: ItemSchemaSource }).schema;
  }
  return undefined;
};

/**
 * The item schema of a widget.
 *
 * A `schemaName` names a registered `schema` utility and wins over `schema`,
 * as in Volto. Either can be a schema or a function that builds one from the
 * widget's props. A source that doesn't build a schema with fieldsets gives
 * the empty schema, so the list still renders its items.
 */
export function resolveItemSchema(props: {
  schema?: unknown;
  schemaName?: string;
}): ItemSchema {
  const registered = props.schemaName
    ? config.getUtility({ type: 'schema', name: props.schemaName })?.method
    : undefined;
  const source = schemaSource(registered) ?? schemaSource(props.schema);
  const schema =
    typeof source === 'function'
      ? source(props as Record<string, unknown>)
      : source;
  return isItemSchema(schema) ? schema : EMPTY_ITEM_SCHEMA;
}

/** The fields of a schema, in the order of its fieldsets. */
export const schemaFields = (schema: ItemSchema): string[] =>
  schema.fieldsets.flatMap((fieldset) => fieldset.fields);

/**
 * A random id for a new item, as a version 4 UUID.
 *
 * It uses `crypto.getRandomValues` rather than `crypto.randomUUID`, which
 * browsers only offer on secure origins: a site served over plain HTTP could
 * not add items otherwise.
 */
export function newItemId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/**
 * The key of each item: its `@id` when no earlier item uses it, else its
 * position. A position key starts with `#`, which no `@id` this widget writes
 * does.
 */
export function itemKeys(items: ObjectListItem[]): string[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    const id = item['@id'];
    if (typeof id === 'string' && id && !seen.has(id)) {
      seen.add(id);
      return id;
    }
    return `#${index}`;
  });
}

/**
 * The items, each with an `@id` of its own. Items that already have a unique
 * one are returned as they are.
 */
export function withItemIds(items: ObjectListItem[]): ObjectListItem[] {
  const keys = itemKeys(items);
  return items.map((item, index) =>
    keys[index].startsWith('#') ? { ...item, '@id': newItemId() } : item,
  );
}

/** The items, with the one at `from` moved to `to`. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(Math.min(to, next.length), 0, moved);
  return next;
}

/**
 * The position an item lands at when it's dropped before or after another,
 * in the list without the moved item.
 */
export function dropIndex(
  from: number,
  target: number,
  position: 'before' | 'after' | 'on',
): number {
  let to = position === 'after' ? target + 1 : target;
  if (from < to) to -= 1;
  return to;
}

/** A new item, with the defaults of its schema and an `@id`. */
export function newItem(schema: ItemSchema): ObjectListItem {
  const item: ObjectListItem = { '@id': newItemId() };
  for (const [name, field] of Object.entries(schema.properties)) {
    if (field.default !== undefined)
      item[name] = structuredClone(field.default);
  }
  return item;
}

/** A copy of an item, with an `@id` of its own. */
export const duplicateItem = (item: ObjectListItem): ObjectListItem => ({
  ...structuredClone(item),
  '@id': newItemId(),
});

/**
 * The text a field's value shows in a row: the label of a choice rather than
 * its token, the entries of a list joined by commas, and the title (or
 * `@id`) of an object, such as a link picked in the object browser. Empty
 * for no value.
 */
export function cellText(
  field: FieldSchema | undefined,
  value: unknown,
): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        cellText((field?.items as FieldSchema | undefined) ?? field, entry),
      )
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.title || record['@id'] || '');
  }
  if (typeof value === 'boolean') return value ? '✓' : '';
  const choice = field?.choices?.find(([token]) => token === value);
  return String(choice ? choice[1] : value);
}

/** Names an item, or how to find its name. */
export type ItemTitle =
  string | ((item: ObjectListItem, index: number) => string | undefined);

/**
 * The name of an item: the field `itemTitle` names (or what its function
 * returns), else its `title`, else the text of its first field. Empty when
 * none of them has a value.
 */
export function titleOf(
  item: ObjectListItem,
  index: number,
  schema: ItemSchema,
  itemTitle?: ItemTitle,
): string {
  if (typeof itemTitle === 'function') return itemTitle(item, index) ?? '';
  const fields = itemTitle
    ? [itemTitle]
    : ['title', ...schemaFields(schema).filter((name) => name !== 'title')];
  for (const name of fields) {
    const text = cellText(schema.properties[name], item[name]);
    if (text) return text;
  }
  return '';
}

/**
 * The summary line of an item: the text of the first field that isn't its
 * title and has a value.
 */
export function summaryOf(
  item: ObjectListItem,
  schema: ItemSchema,
  title: string,
  columns?: string[],
): string {
  const fields = columns?.length ? columns : schemaFields(schema);
  for (const name of fields) {
    const text = cellText(schema.properties[name], item[name]);
    if (text && text !== title) return text;
  }
  return '';
}
