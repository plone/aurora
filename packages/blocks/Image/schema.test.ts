import { describe, expect, it } from 'vitest';
import { ImageSchema } from './schema';

describe('ImageSchema', () => {
  it('marks alignment and size as style fields', () => {
    const schema = ImageSchema({
      formData: { '@type': 'image', url: '/image' },
    });

    expect(schema.properties.align).toMatchObject({
      widget: 'align',
      default: 'center',
      actions: ['left', 'right', 'center'],
      styleField: true,
    });
    expect(schema.properties.size).toMatchObject({
      widget: 'size',
      default: 'l',
      styleField: true,
    });
  });

  describe('alignment/size coupling', () => {
    it('offers all sizes and an editable width when centered', () => {
      const schema = ImageSchema({
        formData: { '@type': 'image', url: '/image', align: 'center' },
      });

      expect(schema.properties.size.actions).toEqual(['s', 'm', 'l']);
      expect(schema.properties.blockWidth.isDisabled).toBe(false);
    });

    it('drops the large size and locks the width when floated', () => {
      const schema = ImageSchema({
        formData: { '@type': 'image', url: '/image', align: 'left', size: 'm' },
      });

      expect(schema.properties.size.actions).toEqual(['s', 'm']);
      expect(schema.properties.blockWidth.isDisabled).toBe(true);
      expect(schema.properties.blockWidth.value).toBe('default');
    });

    it('shows a medium size for a floated image that was large', () => {
      const schema = ImageSchema({
        formData: {
          '@type': 'image',
          url: '/image',
          align: 'right',
          size: 'l',
        },
      });

      expect(schema.properties.size.value).toBe('m');
    });

    it('couples width and size when switching to a floated alignment', () => {
      const schema = ImageSchema({
        formData: { '@type': 'image', url: '/image', align: 'center' },
      });

      expect(
        schema.properties.align.onChangeSideEffects('left', { size: 'l' }),
      ).toEqual({ blockWidth: 'default', size: 'm' });
      expect(
        schema.properties.align.onChangeSideEffects('right', { size: 's' }),
      ).toEqual({ blockWidth: 'default', size: 's' });
    });

    it('does not force any values when switching back to center', () => {
      const schema = ImageSchema({
        formData: { '@type': 'image', url: '/image', align: 'left' },
      });

      expect(
        schema.properties.align.onChangeSideEffects('center', { size: 'm' }),
      ).toEqual({});
    });
  });
});
