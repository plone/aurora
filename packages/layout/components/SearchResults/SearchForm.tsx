import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, useSearchParams } from 'react-router';
import config from '@plone/registry';
import SearchIcon from '@plone/icons/svg/search.svg?react';
import styles from './SearchResults.module.css';

/**
 * The search field on the search page. Submitting starts a new search on the
 * current route, keeping the scope (`path`) and the sort order.
 */
export function SearchForm() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const Button = config.getComponent('Button').component!;
  const inputId = useId();

  const query = searchParams.get('SearchableText') ?? '';
  const path = searchParams.get('path');
  const sort = searchParams.get('sort');

  return (
    <Form method="get" role="search" className={styles.searchForm}>
      <div className={styles.searchField}>
        <SearchIcon className={styles.searchIcon} aria-hidden="true" />
        <label htmlFor={inputId} className="sr-only">
          {t('layout.search.inputLabel')}
        </label>
        <input
          // Reset the field when the term changes through navigation.
          key={query}
          id={inputId}
          className={styles.searchInput}
          type="search"
          name="SearchableText"
          defaultValue={query}
          placeholder={t('layout.search.placeholder')}
        />
      </div>
      {path && <input type="hidden" name="path" value={path} />}
      {sort && <input type="hidden" name="sort" value={sort} />}
      <Button type="submit" className={styles.searchSubmit}>
        {t('layout.search.submit')}
      </Button>
    </Form>
  );
}
