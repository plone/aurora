import React from 'react';
import { twMerge } from 'tailwind-merge';
import { ArrowleftIcon, ArrowrightIcon } from '@plone/icons';
import { Button } from '../Button/Button';

export interface PaginationProps {
  /** The number of pages. Nothing is rendered when there is only one. */
  totalPages: number;
  /** The current page, starting from 0. */
  currentPage?: number;
  /** Called with the page to go to, starting from 0. */
  onPageChange: (page: number) => void;
  /** The accessible name of the navigation landmark. */
  'aria-label'?: string;
  prevLabel?: string;
  nextLabel?: string;
  /** Prefixed to the page number, to make each page button's accessible name. */
  pageLabel?: string;
  className?: string;
}

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

// The first and last pages, and the two pages on each side of the current
// one, with an ellipsis for each gap of more than one page.
function getItems(totalPages: number, currentPage: number): PaginationItem[] {
  const first = Math.max(0, currentPage - 2);
  const last = Math.min(totalPages - 1, currentPage + 2);
  const items: PaginationItem[] = [];

  if (first > 0) items.push(0);
  if (first > 2) items.push('ellipsis-start');
  else if (first === 2) items.push(1);
  for (let page = first; page <= last; page++) items.push(page);
  if (last < totalPages - 3) items.push('ellipsis-end');
  else if (last === totalPages - 3) items.push(totalPages - 2);
  if (last < totalPages - 1) items.push(totalPages - 1);

  return items;
}

/**
 * Page navigation for a batched listing, with previous and next buttons.
 */
export function Pagination({
  totalPages,
  currentPage = 0,
  onPageChange,
  'aria-label': ariaLabel = 'Pagination',
  prevLabel = 'Previous page',
  nextLabel = 'Next page',
  pageLabel = 'Page',
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={twMerge('flex items-center gap-1', className)}
    >
      <Button
        aria-label={prevLabel}
        isDisabled={currentPage === 0}
        onPress={() => onPageChange(currentPage - 1)}
      >
        <ArrowleftIcon size="sm" />
      </Button>
      {getItems(totalPages, currentPage).map((item) =>
        typeof item === 'number' ? (
          <Button
            key={item}
            aria-label={`${pageLabel} ${item + 1}`}
            aria-current={item === currentPage ? 'page' : undefined}
            variant={item === currentPage ? 'primary' : 'neutral'}
            accent={item === currentPage}
            className="min-w-9 px-2 tabular-nums"
            onPress={() => onPageChange(item)}
          >
            {item + 1}
          </Button>
        ) : (
          <span
            key={item}
            aria-hidden
            className="min-w-9 text-center text-base text-quanta-pigeon"
          >
            …
          </span>
        ),
      )}
      <Button
        aria-label={nextLabel}
        isDisabled={currentPage === totalPages - 1}
        onPress={() => onPageChange(currentPage + 1)}
      >
        <ArrowrightIcon size="sm" />
      </Button>
    </nav>
  );
}
