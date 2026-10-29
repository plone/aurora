import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import config from '@plone/registry';
import type { Brain } from '@plone/types';
import { SearchSort } from './SearchSort';
import styles from './SearchResults.module.css';

export interface SearchResultsProps {
  items: Brain[];
  total: number;
  /** The search term, used for the count line and to highlight matches. */
  query?: string;
  /** Offset of the first item, used for the "showing" range. */
  bStart?: number;
  loading?: boolean;
}

const PLACEHOLDER_DATE = '1969-12-31T00:00:00+00:00';
const OPERATORS = new Set(['AND', 'OR', 'NOT']);

function formatDate(value: string | undefined, locale: string) {
  if (!value || value === PLACEHOLDER_DATE) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date);
}

function getTerms(query: string) {
  return query
    .split(/\s+/)
    .map((word) => word.replace(/[*"()]/g, ''))
    .filter((word) => word && !OPERATORS.has(word));
}

function highlight(text: string, terms: string[]): ReactNode {
  if (!text || terms.length === 0) {
    return text;
  }
  const escaped = terms.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  // Terms are searched as word prefixes, so only match at the start of a word.
  // With one capturing group, split() puts the matches at the odd indexes.
  return text
    .split(new RegExp(`(?<![\\p{L}\\p{N}])(${escaped.join('|')})`, 'giu'))
    .map((part, index) =>
      index % 2 === 1 ? <mark key={index}>{part}</mark> : part,
    );
}

export function SearchResults({
  items,
  total,
  query = '',
  bStart = 0,
  loading = false,
}: SearchResultsProps) {
  const { t, i18n } = useTranslation();
  const Link = config.getComponent('Link').component!;
  const terms = getTerms(query);

  let count: string;
  if (loading) {
    count = t('layout.search.loading');
  } else if (total === 0) {
    count = query
      ? t('layout.search.noResultsFor', { query })
      : t('layout.search.noResults');
  } else {
    count = query
      ? t('layout.search.resultCountFor', { count: total, query })
      : t('layout.search.resultCount', { count: total });
    if (total > items.length) {
      count += ` · ${t('layout.search.showing', {
        start: bStart + 1,
        end: bStart + items.length,
      })}`;
    }
  }

  return (
    <section
      className={styles.results}
      aria-label={t('layout.search.resultsLabel')}
      aria-busy={loading || undefined}
    >
      <div className={styles.resultsBar}>
        <p className={styles.count} role="status">
          {count}
        </p>
        {total > 0 && <SearchSort />}
      </div>
      {items.length > 0 ? (
        <div className={styles.list}>
          {items.map((item) => {
            const date = formatDate(item.effective, i18n.language);
            const typeLabel = item.type_title || item['@type'];
            return (
              <article className={styles.item} key={item['@id']}>
                {(typeLabel || date) && (
                  <div className={styles.meta}>
                    {typeLabel && (
                      <span className={styles.type}>{typeLabel}</span>
                    )}
                    {date && (
                      <time
                        className={styles.metaDate}
                        dateTime={item.effective}
                      >
                        {date}
                      </time>
                    )}
                  </div>
                )}
                <h2 className={styles.headline}>
                  <Link className={styles.headlineLink} href={item['@id']}>
                    {highlight(item.title, terms)}
                  </Link>
                </h2>
                {item.description && (
                  <p className={styles.description}>
                    {highlight(item.description, terms)}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className={styles.noResults}>
            <strong>{t('layout.search.nothingFound')}</strong>
            <p>{t('layout.search.noResultsHint')}</p>
          </div>
        )
      )}
    </section>
  );
}
