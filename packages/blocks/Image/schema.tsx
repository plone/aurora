import type {
  BlocksFormData,
  JSONSchema,
  SchemaEnhancerArgs,
} from '@plone/types';

export function ImageSchema({
  formData = {} as BlocksFormData,
}: { formData?: BlocksFormData } = {}): JSONSchema {
  // A floated (left/right) image reserves a fixed, narrow footprint so the
  // following blocks can wrap around it. In that state the block width is fixed
  // to `default` (and its control disabled) and the large size is not offered.
  const isFloated = (align?: unknown) => align === 'left' || align === 'right';
  const floated = isFloated(formData.align);

  return {
    title: 'Image',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          ...(formData.url
            ? ['url', 'alt', 'blockWidth', 'align', 'size']
            : []),
        ],
      },
      ...(formData.url
        ? [
            {
              id: 'link_settings',
              title: 'Link settings',
              fields: ['href', 'openLinkInNewTab'],
            },
          ]
        : []),
    ],
    properties: {
      url: {
        title: 'Image URL',
        widget: 'image',
      },
      alt: {
        title: 'Alt text',
        description: (
          <>
            <a
              href="https://www.w3.org/WAI/tutorials/images/decision-tree/"
              title="Open in a new tab"
              target="_blank"
              rel="noopener noreferrer"
            >
              Describe the purpose of the image.
            </a>{' '}
            Leave empty if the image is purely decorative.
          </>
        ),
      },
      blockWidth: {
        title: 'Block width',
        widget: 'width',
        default: 'default',
        // While floated the width is fixed to `default` and not editable.
        value: floated ? 'default' : (formData.blockWidth ?? 'default'),
        isDisabled: floated,
        styleField: true,
      },
      align: {
        title: 'Alignment',
        widget: 'align',
        default: 'center',
        actions: ['left', 'right', 'center'],
        // Switching to a floated alignment fixes the width and drops the large
        // size; switching back to center releases both controls again.
        onChangeSideEffects: (value: string, data: BlocksFormData) => {
          if (isFloated(value)) {
            const currentSize = (data.size as string) ?? 'l';
            return {
              blockWidth: 'default',
              size: currentSize === 'l' ? 'm' : currentSize,
            };
          }
          return {};
        },
        styleField: true,
      },
      size: {
        title: 'Image size',
        widget: 'size',
        default: 'l',
        // Large is only available for centered images.
        actions: floated ? ['s', 'm'] : ['s', 'm', 'l'],
        value: floated
          ? (formData.size as string) === 'l' || !formData.size
            ? 'm'
            : (formData.size as string)
          : ((formData.size as string) ?? 'l'),
        styleField: true,
      },
      href: {
        title: 'Link to',
        widget: 'object_browser',
        mode: 'link',
        selectedItemAttrs: ['Title', 'Description', 'hasPreviewImage'],
        allowExternals: true,
      },
      openLinkInNewTab: {
        title: 'Open in a new tab',
        type: 'boolean',
      },
    },
    required: [],
  };
}

export const gridImageDisableSizeAndPositionHandlersSchema = ({
  schema,
}: SchemaEnhancerArgs): JSONSchema => {
  schema.fieldsets[0].fields = schema.fieldsets[0].fields.filter(
    (item) => !['align', 'size'].includes(item),
  );
  return schema;
};
