import { useTranslation } from 'react-i18next';
import { Link } from '@plone/components';
import { PageIcon } from '@plone/components/Icons';
import { getContentIcon } from '@plone/helpers';
import type { Brain } from '@plone/types';
import styles from './SearchResults.module.css';

export interface SearchResultsProps {
  items: Brain[];
  total: number;
  loading?: boolean;
}

function formatDate(value: string | undefined, locale: string) {
  if (!value || value.startsWith('1969') || value.startsWith('1970')) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function SearchResults({
  items,
  total,
  loading = false,
}: SearchResultsProps) {
  const { t, i18n } = useTranslation();

  return (
    <section
      className={styles.results}
      aria-label={t('layout.search.resultsLabel')}
      aria-busy={loading || undefined}
    >
      <p
        className={styles.count}
        role="status"
        aria-controls="search-result-items"
      >
        {loading
          ? t('layout.search.loading')
          : t('layout.search.resultCount', { count: total })}
      </p>
      <div id="search-result-items" className={styles.list}>
        {items.map((item) => {
          const Icon = getContentIcon(item['@type']) ?? PageIcon;
          const date = formatDate(item.effective, i18n.language);
          return (
            <article className={styles.item} key={item['@id']}>
              <span className={styles.icon}>
                <Icon />
              </span>
              <div className={styles.body}>
                <h2 className={styles.headline}>
                  <Link href={item['@id']}>{item.title}</Link>
                </h2>
                {item.description && (
                  <p className={styles.description}>{item.description}</p>
                )}
                {date && (
                  <div className={styles.meta}>
                    <span className={styles.metaDate}>{date}</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
