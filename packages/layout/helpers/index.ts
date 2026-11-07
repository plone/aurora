import { matchPath } from 'react-router';
import type { Content } from '@plone/types';
import type { Location, PathPattern } from 'react-router';

export function RouteCondition(path: string | PathPattern) {
  return ({ location }: { location: Location }) =>
    Boolean(matchPath(path, location.pathname));
}

export function NotRouteCondition(path: string | PathPattern) {
  return ({ location }: { location: Location }) =>
    !Boolean(matchPath(path, location.pathname));
}

export function ContentTypeCondition(contentType: string[]) {
  return ({ content, location }: { content: Content; location: Location }) => {
    return (
      contentType.includes(content?.['@type']) ||
      contentType.some((type) => {
        return location.search.includes(`type=${encodeURIComponent(type)}`);
      })
    );
  };
}

export function NotContentTypeCondition(contentType: string[]) {
  return ({ content, location }: { content: Content; location: Location }) => {
    return (
      !contentType.includes(content?.['@type']) &&
      !contentType.some((type) => {
        return location.search.includes(`type=${encodeURIComponent(type)}`);
      })
    );
  };
}

/**
 * Whether the user can edit the item, the `@@edit` view: Plone gives the
 * `edit` action to users with the permission to modify it.
 */
export function canEdit(content?: Content | null) {
  const actions = content?.['@components']?.actions;
  return (
    (actions?.object?.some((a) => a.id === 'edit') ?? false) ||
    (actions?.object_buttons?.some((a) => a.id === 'edit') ?? false)
  );
}

export function shouldShowToolbar(content?: Content | null) {
  return canEdit(content);
}

/**
 * Whether the user can see the contents of the item, the `@@contents` view:
 * Plone gives the `folderContents` object action to users with the
 * permission to list its contents.
 */
export function canViewContents(content?: Content | null) {
  return (
    content?.['@components']?.actions?.object?.some(
      (action) => action.id === 'folderContents',
    ) ?? false
  );
}

export function isSameDay(start: string, end: string): boolean {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return (
    startDate.getDate() === endDate.getDate() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  );
}

export function getDate(date: string | Date, locale: string): string {
  const dateObject = typeof date === 'string' ? new Date(date) : date;

  const dateTimeFormat = Intl.DateTimeFormat([locale], {
    dateStyle: 'medium',
  });

  return dateTimeFormat.format(dateObject);
}
