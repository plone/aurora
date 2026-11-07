import type { ContentTypesCapabilities } from './driver';
import type { ContentTypeTab } from './paths';
import type { ContentTypeChanges, ContentTypeSettings } from './types';

/** What a type's page edits: every changeable setting, in one form. */
export type EditableSettings = Required<
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
  behaviors: ['behaviors'],
};

/** The form values for a type's settings. */
export function toEditableSettings(
  settings: ContentTypeSettings,
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
  };
}

const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/** The settings that differ between the saved and the edited values. */
export function changedSettings(
  saved: EditableSettings,
  edited: EditableSettings,
): ContentTypeChanges {
  const changes: Record<string, unknown> = {};
  for (const key of Object.keys(edited) as Array<keyof EditableSettings>) {
    if (!equal(saved[key], edited[key])) changes[key] = edited[key];
  }
  return changes as ContentTypeChanges;
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
