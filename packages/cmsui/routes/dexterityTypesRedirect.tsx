import { redirect, type LoaderFunctionArgs } from 'react-router';
import { contentTypeHref } from '@plone/controlpanels';
import { CONTENT_TYPES_PATH } from '../helpers/contentTypesPath';

/**
 * Volto's content types control panel is `dexterity-types`. Its URLs,
 * `/@@controlpanel/dexterity-types[/:type[/schema|/layout]]` here, redirect
 * to the matching page of `/@@controlpanel/content-types`.
 */
export function loader({ params }: LoaderFunctionArgs) {
  const { type, page } = params;
  if (!type) return redirect(CONTENT_TYPES_PATH, 301);
  const tab =
    page === 'schema' ? 'fields' : page === 'layout' ? 'layout' : 'settings';
  return redirect(contentTypeHref(CONTENT_TYPES_PATH, type, tab), 301);
}
