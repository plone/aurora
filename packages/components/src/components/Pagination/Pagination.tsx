import React, { useRef } from 'react';
import { VisuallyHidden } from 'react-aria';
import { ArrowleftIcon, ArrowrightIcon } from '@plone/icons';
import { Link } from 'react-aria-components';
import clsx from 'clsx';
import { Button } from '../Button/Button';

export type PaginationProps = {
  totalPages: number;
  /** The current page, starting from 0. */
  currentPage: number;
  /** Called with the page to go to, starting from 0. */
  onPageChange?: (page: number) => void;
  /**
   * Returns the address of a page, starting from 0. When set, the pages render
   * as links instead of buttons, so they work without JavaScript and crawlers
   * can follow them.
   */
  getPageHref?: (page: number) => string;

  ariaLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
  /** Shows `prevLabel` and `nextLabel` next to the arrows. */
  showPrevNextLabels?: boolean;
  currentLabel?: string;
  pageLabel?: string;
  className?: string;
  buttonComponent?: React.ElementType;
  // --- props to change page size. Not implemented yet.---
  // pageSize: number;
  // pageSizes: Array<number>;
  // onChangePageSizes: (pageSize: number) => void;
};

export const Pagination = ({
  totalPages,
  currentPage = 0,
  onPageChange,

  ariaLabel = 'Pagination',
  prevLabel = 'Previous page',
  nextLabel = 'Next page',
  currentLabel = 'Current page',
  pageLabel = 'Page',
  getPageHref,
  showPrevNextLabels = false,
  className,
  buttonComponent: ButtonComponent = Button,
  // pageSize,
  // pageSizes,
  //onChangePageSizes,
}: PaginationProps) => {
  const ref = useRef<HTMLElement | null>(null);

  type PageType = {
    type: string;
    label?: string;
    value?: number;
    text?: string;
    icon?: any;
    className?: string;
    disabled?: boolean;
    ariaLabel?: string;
    current?: boolean;
  };
  const pages = [] as PageType[];

  //previous button
  pages.push({
    type: 'prev-next',
    value: currentPage - 1,
    icon: <ArrowleftIcon />,
    label: prevLabel,
    className: 'previous-page',
    disabled: currentPage == 0,
    ariaLabel: prevLabel,
  });

  //page 1, always visible
  if (currentPage > 2) {
    pages.push({
      type: 'page',
      value: 0,
      text: '1',
    });
  }

  //dots
  if (currentPage > 3) {
    pages.push({ type: 'other-items', disabled: true, text: '...' });
  }

  //current page -2
  if (currentPage > 1) {
    pages.push({
      type: 'page',
      value: currentPage - 2,
      text: `${currentPage - 1}`,
    });
  }
  //current page -1
  if (currentPage > 0) {
    pages.push({
      type: 'page',
      value: currentPage - 1,
      text: `${currentPage}`,
      current: true,
    });
  }
  //current page
  if (totalPages > 1) {
    pages.push({
      type: 'page',
      value: currentPage,
      text: `${currentPage + 1}`,
      current: true,
      className: 'active',
      ariaLabel: currentLabel,
    });
  }

  //current page +1
  if (totalPages > currentPage + 1) {
    pages.push({
      type: 'page',
      value: currentPage + 1,
      text: `${currentPage + 2}`,
    });
  }
  //current page +2
  if (totalPages > currentPage + 2) {
    pages.push({
      type: 'page',
      value: currentPage + 2,
      text: `${currentPage + 3}`,
    });
  }

  //dots
  if (totalPages > currentPage + 4) {
    pages.push({ type: 'other-items', disabled: true, text: '...' });
  }

  //last page
  if (totalPages > currentPage + 3) {
    pages.push({
      type: 'page',
      value: totalPages - 1,
      text: `${totalPages}`,
    });
  }

  //next button
  pages.push({
    type: 'prev-next',
    value: currentPage + 1,
    icon: <ArrowrightIcon />,
    label: nextLabel,
    className: 'next-page',
    disabled: currentPage == totalPages - 1,
    ariaLabel: nextLabel,
  });

  //TODO: handle change pagesize

  const renderContent = (page: PageType) =>
    page.icon ? (
      showPrevNextLabels ? (
        page.className === 'previous-page' ? (
          <>
            {page.icon}
            {page.label}
          </>
        ) : (
          <>
            {page.label}
            {page.icon}
          </>
        )
      ) : (
        page.icon
      )
    ) : (
      page.text
    );

  const renderLink = (page: PageType, i: number) => {
    const key = `${i}${page.value}`;
    const classes = clsx('pagination-item', page.className);
    // The ellipses, the disabled arrows and the current page aren't links.
    if (page.type === 'other-items') {
      return (
        <span key={key} className={clsx(classes, 'ellipsis')} aria-hidden>
          …
        </span>
      );
    }
    if (page.disabled) {
      return (
        <span key={key} className={clsx(classes, 'disabled')} aria-hidden>
          {renderContent(page)}
        </span>
      );
    }
    if (page.className === 'active') {
      return (
        <span key={key} className={classes} aria-current="page">
          {page.text}
        </span>
      );
    }
    return (
      <Link
        key={key}
        className={clsx('react-aria-Link', classes)}
        href={getPageHref!(page.value ?? 0)}
        rel={
          page.className === 'previous-page'
            ? 'prev'
            : page.className === 'next-page'
              ? 'next'
              : undefined
        }
        aria-label={
          page.type === 'page'
            ? `${pageLabel} ${page.text}`
            : showPrevNextLabels
              ? undefined
              : page.ariaLabel
        }
      >
        {renderContent(page)}
      </Link>
    );
  };

  return totalPages > 1 ? (
    <nav
      aria-label={ariaLabel}
      ref={ref}
      className={clsx('pagination', className)}
    >
      {getPageHref
        ? pages.map(renderLink)
        : pages.map((page, i) => {
            const buttonAttributes = {
              className: page.className
                ? clsx('react-aria-Button', page.className)
                : undefined,
              isDisabled: page.disabled,
              'aria-label':
                page.ariaLabel ??
                (page.type === 'page'
                  ? `${pageLabel} ${page.text}`
                  : undefined),
            };

            return (
              <ButtonComponent
                {...buttonAttributes}
                key={`${i}${page.value}`}
                onClick={
                  page.value !== undefined
                    ? () => {
                        onPageChange?.(page.value ?? 0);
                      }
                    : undefined
                }
              >
                {page.type === 'prev-next' && (
                  <VisuallyHidden>{currentPage}</VisuallyHidden>
                )}
                {renderContent(page)}
              </ButtonComponent>
            );
          })}
    </nav>
  ) : (
    <></>
  );
};
