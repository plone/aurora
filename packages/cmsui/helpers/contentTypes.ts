import type { ContentTypeSummary } from '@plone/controlpanels';

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
