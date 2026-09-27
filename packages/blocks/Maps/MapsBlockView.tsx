import type { BlockViewProps } from '@plone/types';
import clsx from 'clsx';
import styles from './MapsBlock.module.css';

const MapsBlockView = (props: BlockViewProps) => {
  const { data } = props;

  return data.url ? (
    <div className={clsx(styles.block, 'maps-block')}>
      <iframe
        title={data?.title}
        src={data.url}
        className={clsx(styles.iframe, 'maps-iframe')}
        allowFullScreen
      />
    </div>
  ) : null;
};

export default MapsBlockView;
