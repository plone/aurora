import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';
import { Link } from '@plone/components';
import styles from './SearchResults.module.css';

export interface SearchPaginationProps {
  total: number;
  bStart: number;
  bSize: number;
}

type PageItem = number | 'ellipsis';

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  const pages = new Set<number>([
    0,
    totalPages - 1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const visible = [...pages]
    .filter((page) => page >= 0 && page < totalPages)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous: number | undefined;
  for (const page of visible) {
    if (previous !== undefined && page - previous > 1) {
      items.push('ellipsis');
    }
    items.push(page);
    previous = page;
  }
  return items;
}

export function SearchPagination({
  total,
  bStart,
  bSize,
}: SearchPaginationProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const totalPages = Math.ceil(total / bSize);
  const currentPage = Math.floor(bStart / bSize);

  if (totalPages <= 1) {
    return null;
  }

  const linkTo = (page: number) => {
    const next = new URLSearchParams(searchParams);
    if (page <= 0) {
      next.delete('b_start');
    } else {
      next.set('b_start', String(page * bSize));
    }
    const search = next.toString();
    return search ? `${pathname}?${search}` : pathname;
  };

  const items = getPageItems(currentPage, totalPages);

  return (
    <nav
      className={styles.pagination}
      aria-label={t('layout.search.pagination')}
    >
      {currentPage > 0 ? (
        <Link
          className={styles.pageNav}
          href={linkTo(currentPage - 1)}
          rel="prev"
          aria-label={t('layout.search.previous')}
        >
          ‹
        </Link>
      ) : (
        <span
          className={clsx(styles.pageNav, styles.pageDisabled)}
          aria-hidden="true"
        >
          ‹
        </span>
      )}

      {items.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className={styles.ellipsis}
            aria-hidden="true"
          >
            …
          </span>
        ) : item === currentPage ? (
          <span
            key={item}
            className={clsx(styles.pageItem, styles.pageCurrent)}
            aria-current="page"
          >
            {item + 1}
          </span>
        ) : (
          <Link
            key={item}
            className={styles.pageItem}
            href={linkTo(item)}
            aria-label={t('layout.search.page', { page: item + 1 })}
          >
            {item + 1}
          </Link>
        ),
      )}

      {currentPage < totalPages - 1 ? (
        <Link
          className={styles.pageNav}
          href={linkTo(currentPage + 1)}
          rel="next"
          aria-label={t('layout.search.next')}
        >
          ›
        </Link>
      ) : (
        <span
          className={clsx(styles.pageNav, styles.pageDisabled)}
          aria-hidden="true"
        >
          ›
        </span>
      )}
    </nav>
  );
}
