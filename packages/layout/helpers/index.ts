import type { Location, PathPattern } from 'react-router';
import { matchPath } from 'react-router';
import { getStyleFieldsFromBlockSchema } from '@plone/helpers';
import type { BlocksConfigData, BlocksFormData, Content } from '@plone/types';

type StyleFieldConfig = {
  defaultValue?: string;
  values?: readonly string[];
  path?: string;
};

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

function getContentActions(content?: Content | null) {
  const actions = content?.['@components']?.actions;
  return [...(actions?.object ?? []), ...(actions?.object_buttons ?? [])];
}

export function hasAction(content: Content | null, actionId: string) {
  return getContentActions(content).some((a) => a.id === actionId);
}

export function shouldShowToolbar(content?: Content | null) {
  return getContentActions(content).some((a) => a.id !== 'view');
}

export function contentRouteUrl(prefix: string, pathname: string) {
  return `/${prefix}${pathname.replace(/^\/$/, '')}`;
}

export const getBlockStyleFieldConfigs = (
  data: BlocksFormData,
  blocksConfig?: BlocksConfigData,
) => {
  const blockType = data['@type'];

  if (!blockType) return {};

  const blockConfig = blocksConfig?.[blockType];
  const styleFields = getStyleFieldsFromBlockSchema(blockConfig, data);

  // Keep `blockWidth` as a fallback for Plone blocks that wants to configure it
  // in blocksConfig instead using a explicit width schema field marked with `styleField: true`.
  if (blockConfig?.blockWidth) {
    styleFields.blockWidth = {
      defaultValue: blockConfig.blockWidth.defaultWidth,
      values: blockConfig.blockWidth.widths,
    };
  }

  return styleFields as Record<string, StyleFieldConfig>;
};

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
