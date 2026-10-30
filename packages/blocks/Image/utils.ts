import { flattenToAppURL, isInternalURL } from '@plone/helpers';
import type {
  BlocksFormData,
  Brain,
  ContainedItem,
  Content,
  RelatedItem,
} from '@plone/types';

type ImageItem = Content | Brain | ContainedItem | RelatedItem;

/**
 * Build the `item` prop for the `Image` component.
 *
 * We only have `image_scales`/`image_field` when the image is picked through the
 * object browser (they come from the catalog brain). On subsequent requests the
 * server serializer enhances the block data with them again, so the responsive
 * path keeps working after a save/reload. When they are missing (eg. an external
 * URL, or a freshly uploaded image) we fall back to `src` instead.
 */
export function getImageBlockItem(data: BlocksFormData): ImageItem | undefined {
  return data.image_scales
    ? ({
        '@id': data.url,
        image_field: data.image_field,
        image_scales: data.image_scales,
      } as unknown as ImageItem)
    : undefined;
}

/**
 * Build the `src` prop for the `Image` component.
 *
 * When `image_scales` are available we let the `item` drive the responsive
 * `srcSet`, so `src` must be `undefined`. Otherwise we fall back to the legacy
 * `@@images` scales for internal URLs (backwards compatibility with blocks that
 * only stored a URL) or to the raw URL for external images.
 */
export function getImageBlockSrc(data: BlocksFormData): string | undefined {
  if (data.image_scales || !data.url) return undefined;

  if (isInternalURL(data.url)) {
    const base = flattenToAppURL(data.url);
    if (data.size === 'm') return `${base}/@@images/image/preview`;
    if (data.size === 's') return `${base}/@@images/image/mini`;
    return `${base}/@@images/image`;
  }

  return data.url;
}

/**
 * Resolve the link target for the image, if any.
 *
 * The `href` field is an object browser (link mode) value, so it is stored as an
 * array of items (or a single item) each carrying an `@id`; external links are
 * plain strings. Internal URLs are flattened to the app URL.
 */
export function getImageBlockHref(data: BlocksFormData): string | undefined {
  const href = data.href as unknown;
  const first = Array.isArray(href) ? href[0] : href;

  if (!first) return undefined;

  const url =
    typeof first === 'string' ? first : (first as { '@id'?: string })['@id'];

  return url ? flattenToAppURL(url) : undefined;
}
