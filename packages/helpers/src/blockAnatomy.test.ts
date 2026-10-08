import { describe, expect, it } from 'vitest';

import { resolveBlockAnatomy } from './blockAnatomy';

describe('resolveBlockAnatomy', () => {
  it('resolves block model class names and data attributes', () => {
    expect(
      resolveBlockAnatomy({
        type: 'teaser',
        category: 'common',
      }),
    ).toEqual({
      className: 'block block-teaser category-common',
      dataAttributes: {
        'data-block-type': 'teaser',
        'data-block-category': 'common',
      },
    });
  });
});
