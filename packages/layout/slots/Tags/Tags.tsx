import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import config from '@plone/registry';
import type { SlotComponentProps } from '../SlotRenderer';
import SectionWrapper from '../../components/SectionWrapper/SectionWrapper';
import styles from './Tags.module.css';

const Tags = (props: SlotComponentProps) => {
  const { t } = useTranslation();
  const tags = (props.content?.subjects ?? []) as string[];

  if (config.settings.showTags === false || tags.length === 0) {
    return null;
  }

  return (
    <SectionWrapper as="nav" width="layout" aria-label={t('layout.tags.label')}>
      <div className={styles.tags}>
        {tags.map((tag) => (
          <Link
            key={tag}
            to={`/search?Subject=${encodeURIComponent(tag)}`}
            className={styles.tag}
          >
            {tag}
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default Tags;
