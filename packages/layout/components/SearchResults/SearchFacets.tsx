import { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { ChevrondownIcon } from '@plone/components/Icons';
import clsx from 'clsx';
import type { Brain } from '@plone/types';
import styles from './SearchResults.module.css';

export interface Facet {
  subject: string;
  count: number;
}

export function aggregateFacets(items: Pick<Brain, 'Subject'>[]): Facet[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const subject of item.Subject ?? []) {
      counts.set(subject, (counts.get(subject) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject));
}

export interface SearchFacetsProps {
  facets: Facet[];
}

export function SearchFacets({ facets }: SearchFacetsProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const selected = new Set(searchParams.getAll('Subject'));
  // Collapsed by default; open when a tag filter is already active.
  const listId = useId();
  const [open, setOpen] = useState(selected.size > 0);

  if (facets.length === 0) {
    return null;
  }

  const toggle = (subject: string) => {
    const updated = new Set(selected);
    if (updated.has(subject)) {
      updated.delete(subject);
    } else {
      updated.add(subject);
    }

    const next = new URLSearchParams(searchParams);
    next.delete('Subject');
    for (const value of updated) {
      next.append('Subject', value);
    }
    next.delete('b_start');
    setSearchParams(next);
  };

  return (
    <div className={styles.facets}>
      <button
        type="button"
        className={styles.facetsToggle}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{t('layout.search.filterByTag')}</span>
        <ChevrondownIcon
          className={clsx(
            styles.facetsChevron,
            open && styles.facetsChevronOpen,
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={clsx(styles.facetListWrap, open && styles.facetListWrapOpen)}
      >
        <div className={styles.facetListInner} inert={!open}>
          <div
            className={styles.facetList}
            id={listId}
            role="group"
            aria-label={t('layout.search.filterByTag')}
          >
            {facets.map(({ subject, count }) => (
              <label key={subject} className={styles.facet}>
                <input
                  type="checkbox"
                  checked={selected.has(subject)}
                  onChange={() => toggle(subject)}
                />
                <span className={styles.facetLabel}>{subject}</span>
                <span className={styles.facetCount}>{count}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
