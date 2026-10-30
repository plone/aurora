import { describe, expect, it } from 'vitest';
import { flattenScales } from './Image';

describe('flattenScales', () => {
  it('makes the image and scale downloads relative to the object', () => {
    expect(
      flattenScales('/photo', {
        download: '/photo/@@images/image-800.png',
        scales: { thumb: { download: '/photo/@@images/image-128.png' } },
      }),
    ).toEqual({
      download: '@@images/image-800.png',
      scales: { thumb: { download: '@@images/image-128.png' } },
    });
  });

  it('keeps an image without scales or download as it is', () => {
    const image = { 'content-type': 'image/png', filename: 'photo.png' };

    expect(flattenScales('/photo', image)).toEqual(image);
    expect(flattenScales('/photo', { ...image, scales: null })).toEqual({
      ...image,
      scales: null,
    });
  });
});
