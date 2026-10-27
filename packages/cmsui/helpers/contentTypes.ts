import type {
  AllowedContents,
  ContentTypeChanges,
  ContentTypeSettings,
  ContentTypeSummary,
} from '@plone/controlpanels';

// The content types control panel works with its own model
// (`@plone/controlpanels`). Until plone.restapi has `@content-types`
// (plone/plone.restapi#2061), the Aurora driver reads and writes types through
// `@controlpanels/dexterity-types`, and these helpers translate its payloads.

/** An item of the `@controlpanels/dexterity-types` listing. */
export interface DexterityTypesItem {
  '@id': string;
  id: string;
  title: string;
  description?: string;
  meta_type?: string;
  count?: number;
}

/** The site root's type id, which can't be deleted or added anywhere. */
export const SITE_TYPE = 'Plone Site';

/** Turns an item of the dexterity types listing into a list row. */
export function toContentTypeSummary(
  item: DexterityTypesItem,
): ContentTypeSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    kind:
      item.id === SITE_TYPE
        ? 'site'
        : item.meta_type && item.meta_type !== 'Dexterity FTI'
          ? 'other'
          : 'dexterity',
    count: item.count ?? 0,
  };
}

/** The message of a content API error, for the UI. */
export function errorMessage(error: unknown, fallback: string): string {
  const failure = error as {
    data?: { message?: string; error?: { message?: string } };
    message?: string;
  };
  return (
    failure?.data?.message ||
    failure?.data?.error?.message ||
    failure?.message ||
    fallback
  );
}

/** `GET @controlpanels/dexterity-types/{type}`: the overview form of a type. */
export interface DexterityTypeResponse {
  '@id': string;
  title: string;
  data: {
    title?: string;
    description?: string;
    allowed_content_types?: string[];
    /**
     * The stored value (`true`/`false`), although the schema describes the
     * form's `all`/`none`/`some` choice.
     */
    filter_content_types?: boolean | 'all' | 'none' | 'some';
    [behavior: string]: unknown;
  };
  schema: {
    properties: Record<string, unknown>;
    fieldsets: Array<{ id: string; fields: string[] }>;
  };
}

/** Turns a type's overview form into the control panel's settings. */
export function toContentTypeSettings(
  id: string,
  response: DexterityTypeResponse,
): ContentTypeSettings {
  const { data, schema } = response;
  // The form only has the contents fields for folderish types.
  const folderish = 'filter_content_types' in schema.properties;
  const behaviorFields =
    schema.fieldsets.find((fieldset) => fieldset.id === 'behaviors')?.fields ??
    [];
  const allowed = data.allowed_content_types ?? [];
  const filter = data.filter_content_types;
  const allowedContents: AllowedContents =
    filter === 'all' || filter === false || filter === undefined
      ? { mode: 'all' }
      : filter === 'none' || allowed.length === 0
        ? { mode: 'none' }
        : { mode: 'selected', types: allowed };
  return {
    id,
    title: data.title ?? response.title,
    description: data.description ?? '',
    kind: id === SITE_TYPE ? 'site' : 'dexterity',
    folderish,
    ...(folderish && { allowedContents }),
    // A map of behavior names, unordered: plone.restapi#2061 makes it a list.
    behaviors: behaviorFields.filter((name) => data[name] === true),
  };
}

/** Turns changed settings into a patch of the type's overview form. */
export function toDexterityTypePatch(
  changes: ContentTypeChanges,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (changes.title !== undefined) patch.title = changes.title;
  if (changes.description !== undefined) {
    patch.description = changes.description;
  }
  if (changes.allowedContents) {
    const { allowedContents } = changes;
    if (allowedContents.mode === 'selected') {
      patch.filter_content_types = 'some';
      patch.allowed_content_types = allowedContents.types;
    } else {
      patch.filter_content_types = allowedContents.mode;
      if (allowedContents.mode === 'none') patch.allowed_content_types = [];
    }
  }
  return patch;
}
