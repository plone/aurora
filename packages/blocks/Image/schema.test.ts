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

  it('leaves alignment and size independent (no coupling)', () => {
    const floated = ImageSchema({
      formData: { '@type': 'image', url: '/image', align: 'left', size: 'l' },
    });

    // Width stays editable and every size remains available when floated.
    expect(floated.properties.blockWidth.isDisabled).toBeUndefined();
    expect(floated.properties.align.onChangeSideEffects).toBeUndefined();
    expect(floated.properties.size.actions).toBeUndefined();
  });
});
