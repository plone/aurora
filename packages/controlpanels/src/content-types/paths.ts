/** The tabs of a type's page. */
export type ContentTypeTab =
  'settings' | 'workflow' | 'fields' | 'behaviors' | 'layout';

/**
 * Where the content types control panel lives in Volto, and the screens'
 * default `basePath`. Aurora has it at `/@@controlpanel/content-types`.
 */
export const CONTENT_TYPES_BASE_PATH = '/controlpanel/content-types';

/** The URL of a type's page, on one of its tabs. */
export function contentTypeHref(
  basePath: string,
  id: string,
  tab: ContentTypeTab = 'settings',
): string {
  return `${basePath}/${encodeURIComponent(id)}/${tab}`;
}
