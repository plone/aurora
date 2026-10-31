import type { ContentTypesCapabilities } from './driver';
import type { ContentTypeTab } from './paths';
import type {
  ContentTypeChanges,
  ContentTypeSettings,
  TypeSchema,
} from './types';

/**
 * What a type's page edits: every changeable setting, and the schema of
 * types that have one, in one form.
 */
export type EditableSettings = { schema?: TypeSchema } & Required<
  Pick<ContentTypeSettings, 'title' | 'description' | 'behaviors'>
> &
  Pick<
    ContentTypeSettings,
    | 'allowedContents'
    | 'globalAllow'
    | 'searchable'
    | 'defaultPage'
    | 'allowDiscussion'
    | 'versioning'
  >;

/** The fields each tab edits, so a tab can show it has unsaved changes. */
export const TAB_FIELDS: Partial<
  Record<ContentTypeTab, Array<keyof EditableSettings>>
> = {
  settings: [
    'title',
    'description',
    'allowedContents',
    'globalAllow',
    'searchable',
    'defaultPage',
    'allowDiscussion',
    'versioning',
  ],
  fields: ['schema'],
  behaviors: ['behaviors'],
};

/** The form values for a type's settings. */
export function toEditableSettings(
  settings: ContentTypeSettings,
  schema?: TypeSchema,
): EditableSettings {
  const {
    title,
    description,
    behaviors,
    allowedContents,
    globalAllow,
    searchable,
    defaultPage,
    allowDiscussion,
    versioning,
  } = settings;
  return {
    title,
    description,
    behaviors,
    ...(allowedContents && { allowedContents }),
    ...(globalAllow !== undefined && { globalAllow }),
    ...(searchable !== undefined && { searchable }),
    ...(defaultPage !== undefined && { defaultPage }),
    ...(allowDiscussion !== undefined && { allowDiscussion }),
    ...(versioning !== undefined && { versioning }),
    ...(schema && { schema }),
  };
}

const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * The settings that differ between the saved and the edited values. The
 * schema is left out: it's saved on its own, with `changedSchema`.
 */
export function changedSettings(
  saved: EditableSettings,
  edited: EditableSettings,
): ContentTypeChanges {
  const changes: Record<string, unknown> = {};
  for (const key of Object.keys(edited) as Array<keyof EditableSettings>) {
    if (key === 'schema') continue;
    if (!equal(saved[key], edited[key])) changes[key] = edited[key];
  }
  return changes as ContentTypeChanges;
}

/** The edited schema, when it differs from the saved one. */
export function changedSchema(
  saved: EditableSettings,
  edited: EditableSettings,
): TypeSchema | undefined {
  return edited.schema && !equal(saved.schema, edited.schema)
    ? edited.schema
    : undefined;
}

/** Which setting needs which capability; the others are always available. */
export const SETTING_CAPABILITIES: Partial<
  Record<keyof EditableSettings, keyof ContentTypesCapabilities>
> = {
  globalAllow: 'globalAllow',
  searchable: 'searchable',
  defaultPage: 'defaultPage',
  allowDiscussion: 'allowDiscussion',
  versioning: 'versioning',
};
