import { useTranslation } from 'react-i18next';
import { Link } from '@plone/components';
import config from '@plone/registry';
import type { SlotComponentProps } from '../SlotRenderer';
import SectionWrapper from '../../components/SectionWrapper/SectionWrapper';
import styles from './RelatedItems.module.css';

const RelatedItems = (props: SlotComponentProps) => {
  const { t } = useTranslation();
  const items = props.content.relatedItems ?? [];

  const showRelatedItems = config.settings.showRelatedItems !== false;
  if (!showRelatedItems || items.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      as="nav"
      width="layout"
      aria-label={t('layout.relatedItems.label')}
    >
      <ul className={styles.relatedItems}>
        {items.map((item) => (
          <li key={item['@id']}>
            <Link href={item['@id']}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </SectionWrapper>
  );
};

export default RelatedItems;
