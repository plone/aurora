import { Link } from 'react-router';
import { flattenToAppURL } from '@plone/helpers';
import { PageIcon } from '@plone/components/Icons';
import type { Brain } from '@plone/types';
import styles from './SearchResults.module.css';

export function SearchResults({ items }: { items: Brain[] }) {
  return (
    <>
      {items.map((item) => (
        <article className={styles.item} key={item['@id']}>
          <span className={styles.icon}>
            <PageIcon />
          </span>
          <div>
            <h2 className={styles.headline}>
              <Link to={flattenToAppURL(item['@id'])}>{item.title}</Link>
            </h2>
            {item.description && (
              <p className={styles.description}>{item.description}</p>
            )}
          </div>
        </article>
      ))}
    </>
  );
}
