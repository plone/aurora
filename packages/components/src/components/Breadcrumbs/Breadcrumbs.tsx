import React from 'react';
import {
  Breadcrumbs as RACBreadcrumbs,
  Breadcrumb as RACBreadcrumb,
  type BreadcrumbProps as RACBreadcrumbProps,
  type BreadcrumbsProps as RACBreadcrumbsProps,
  type LinkProps,
} from 'react-aria-components';
import { Link } from '../Link/Link';
import { HomeIcon } from '@plone/icons';

export type Breadcrumb = {
  '@id': string;
  title: string;
  icon?: React.ReactNode;
};

export function Breadcrumb(
  props: RACBreadcrumbProps &
    Omit<LinkProps, 'className'> & {
      separator?: React.ReactNode;
      value?: Breadcrumb;
    },
) {
  return (
    <RACBreadcrumb {...props}>
      {({ isCurrent }) => (
        <>
          {props.value?.icon}
          <Link {...props} />
          {!isCurrent && props.separator}
        </>
      )}
    </RACBreadcrumb>
  );
}

interface BreadcrumbsProps<
  T extends Breadcrumb = Breadcrumb,
> extends RACBreadcrumbsProps<T> {
  /**
   * If we should include a root item in the breadcrumbs, we provide a Breadcrumb object.
   */
  root?: Breadcrumb;

  /**
   * Shall we surround the RAC Breadcrumbs component with a navigation landmark?
   */
  withNavigationLandmark?: boolean;

  /**
   * Props for the navigation landmark.
   * Default: <nav role="navigation">...</nav>
   */
  navigationLandmarkProps?: Record<string, any>;
}

/**
 * Breadcrumbs display a hierarchy of links to the current page or resource in an application.
 */
export function Breadcrumbs<T extends Breadcrumb>(props: BreadcrumbsProps<T>) {
  const { root, items, withNavigationLandmark, navigationLandmarkProps } =
    props;
  let itemsWithRoot: typeof items;
  if (root && items) {
    const rootItem = {
      '@id': root['@id'] || '/',
      title: root.title,
      icon: root.icon || <HomeIcon size="sm" />,
    } as T;
    itemsWithRoot = [rootItem, ...items];
  }

  const r = <RACBreadcrumbs {...props} items={itemsWithRoot || items} />;
  if (withNavigationLandmark) {
    return (
      <nav role="navigation" {...navigationLandmarkProps}>
        {r}
      </nav>
    );
  }
  return r;
}
