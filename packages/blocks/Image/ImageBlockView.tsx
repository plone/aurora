import type { BlockViewProps } from '@plone/types';
import Image from '@plone/layout/components/Image/Image';
import { Link } from '@plone/components';
import clsx from 'clsx';
import {
  getImageBlockHref,
  getImageBlockItem,
  getImageBlockSrc,
} from './utils';
import styles from './ImageBlock.module.css';

const ImageBlockView = (props: BlockViewProps) => {
  const { data } = props;
  if (!data.url) return null;

  const href = getImageBlockHref(data);
  const openInNewTab = Boolean(data.openLinkInNewTab);

  const image = (
    <Image
      item={getImageBlockItem(data)}
      src={getImageBlockSrc(data)}
      alt={(data.alt as string) || ''}
      loading="lazy"
      responsive={true}
    />
  );

  return (
    <figure className={clsx(styles.imageBlock, 'image-block')}>
      {href ? (
        <Link
          className={styles.imageLink}
          href={href}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {image}
        </Link>
      ) : (
        image
      )}
    </figure>
  );
};

export default ImageBlockView;
