export const PLONE_BLOCK_TYPE = 'ploneBlock';

type BlockAnatomyDataAttributes = Record<`data-${string}`, string>;

export type ResolveBlockAnatomyArgs = {
  category?: string;
  className?: string;
  type?: string;
};

export type ResolvedBlockAnatomy = {
  className: string;
  dataAttributes: BlockAnatomyDataAttributes;
};

const sanitizeClassNamePart = (value?: string) =>
  value?.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');

export const isPloneBlockType = (type?: unknown) => type === PLONE_BLOCK_TYPE;

export const resolveBlockAnatomy = ({
  category,
  className,
  type,
}: ResolveBlockAnatomyArgs): ResolvedBlockAnatomy => {
  const safeType = sanitizeClassNamePart(type);
  const safeCategory = sanitizeClassNamePart(category);
  const classNames = [
    'block',
    safeType && `block-${safeType}`,
    safeCategory && `category-${safeCategory}`,
    className,
  ].filter((value): value is string => !!value);
  const dataAttributes: BlockAnatomyDataAttributes = {};

  if (type) dataAttributes['data-block-type'] = type;
  if (category) dataAttributes['data-block-category'] = category;

  return {
    className: classNames.join(' '),
    dataAttributes,
  };
};
