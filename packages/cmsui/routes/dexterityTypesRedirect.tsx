import { redirect, type LoaderFunctionArgs } from 'react-router';
import { CONTENT_TYPES_BASE_PATH, contentTypeHref } from '@plone/controlpanels';

/**
 * Volto's content types control panel lived at
 * `/controlpanel/dexterity-types[/:type[/schema|/layout]]`. Its URLs
 * redirect to the matching page of `/controlpanel/content-types`.
 */
export function loader({ params }: LoaderFunctionArgs) {
  const { type, page } = params;
  if (!type) return redirect(CONTENT_TYPES_BASE_PATH, 301);
  const tab =
    page === 'schema' ? 'fields' : page === 'layout' ? 'layout' : 'settings';
  return redirect(contentTypeHref(CONTENT_TYPES_BASE_PATH, type, tab), 301);
}
