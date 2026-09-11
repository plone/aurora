import { useCallback } from 'react';
import type { BlockEditProps } from '@plone/types';
import Image from '@plone/layout/components/Image/Image';
import { flattenToAppURL } from '@plone/helpers';
import config from '@plone/registry';
import clsx from 'clsx';
import { getImageBlockItem, getImageBlockSrc } from './utils';
import styles from './ImageBlock.module.css';

const ImageBlockEdit = (props: BlockEditProps) => {
  const { block, data, setBlock, selected } = props;
  const ImageWidget = config.getWidget('image') as
    React.ComponentType<any> | undefined;

  const handleChange = useCallback(
    (
      image: string | null,
      item: {
        title?: string;
        image_field?: string;
        image_scales?: Record<string, unknown>;
      } = {},
    ) => {
      const { title, image_field, image_scales } = item;
      const url = image ? flattenToAppURL(image) : '';

      setBlock({
        ...data,
        url,
        image_field,
        image_scales,
        alt: data.alt || title || '',
      });
    },
    [data, setBlock],
  );

  return (
    <div className={clsx(styles.imageBlock, 'image-block')}>
      {data.url ? (
        <Image
          item={getImageBlockItem(data)}
          src={getImageBlockSrc(data)}
          alt={data.alt || ''}
          loading="lazy"
          responsive={true}
        />
      ) : ImageWidget ? (
        <ImageWidget
          onChange={handleChange}
          value={data.url || ''}
          placeholderLinkInput={data.placeholder}
          id={block}
          selected={selected}
          objectBrowserPickerType="image"
        />
      ) : null}
    </div>
  );
};

export default ImageBlockEdit;
