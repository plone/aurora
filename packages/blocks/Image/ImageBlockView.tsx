import type { BlockViewProps } from '@plone/types';
import Image from '@plone/layout/components/Image/Image';
import { Link } from '@plone/components';
import {
  getImageBlockHref,
  getImageBlockItem,
  getImageBlockSrc,
} from './utils';

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
    <figure className="block-image__frame">
      {href ? (
        <Link
          className="block-image__link"
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
