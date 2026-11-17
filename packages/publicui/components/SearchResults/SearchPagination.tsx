import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';
import config from '@plone/registry';
import styles from './SearchResults.module.css';

export interface SearchPaginationProps {
  total: number;
  bStart: number;
  bSize: number;
}

export function SearchPagination({
  total,
  bStart,
  bSize,
}: SearchPaginationProps) {
  const Pagination = config.getComponent('Pagination').component!;
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  // Real links keep the pages crawlable and working without JavaScript.
  const getPageHref = (page: number) => {
    const next = new URLSearchParams(searchParams);
    if (page <= 0) {
      next.delete('b_start');
    } else {
      next.set('b_start', String(page * bSize));
    }
    const search = next.toString();
    return search ? `${pathname}?${search}` : pathname;
  };

  return (
    <Pagination
      className={styles.pagination}
      totalPages={Math.ceil(total / bSize)}
      currentPage={Math.floor(bStart / bSize)}
      getPageHref={getPageHref}
      ariaLabel={t('publicui.search.pagination')}
      prevLabel={t('publicui.search.previous')}
      nextLabel={t('publicui.search.next')}
      showPrevNextLabels
      pageLabel={t('publicui.search.pageLabel')}
    />
  );
}
