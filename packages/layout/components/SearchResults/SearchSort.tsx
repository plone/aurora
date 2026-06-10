import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import styles from './SearchResults.module.css';

export const SORT_OPTIONS = ['relevance', 'date', 'title'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const DEFAULT_SORT: SortOption = 'relevance';

export function sortToQuery(sort: string | null): {
  sort_on?: string;
  sort_order?: 'ascending' | 'descending';
} {
  switch (sort) {
    case 'date':
      return { sort_on: 'effective', sort_order: 'descending' };
    case 'title':
      return { sort_on: 'sortable_title', sort_order: 'ascending' };
    default:
      return {};
  }
}

export function SearchSort() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const current = (searchParams.get('sort') as SortOption) || DEFAULT_SORT;

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams);
    if (event.target.value === DEFAULT_SORT) {
      next.delete('sort');
    } else {
      next.set('sort', event.target.value);
    }
    next.delete('b_start');
    setSearchParams(next);
  };

  return (
    <div className={styles.sort}>
      <label className={styles.sortLabel} htmlFor="search-sort">
        {t('layout.search.sort.label')}
      </label>
      <select
        id="search-sort"
        className={styles.sortSelect}
        value={current}
        onChange={onChange}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(`layout.search.sort.${option}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
