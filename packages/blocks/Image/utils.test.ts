import { describe, expect, it } from 'vitest';

import { getContainerImageSizes } from './utils';

const column = (size: number, totalSize: number, stack = true) => ({
  type: 'grid',
  data: { stack },
  index: 0,
  count: 2,
  size,
  totalSize,
});

describe('getContainerImageSizes', () => {
  it('asks for the column share of the width', () => {
    expect(getContainerImageSizes(column(2, 3))).toBe(
      '(max-width: 40rem) 100vw, 67vw',
    );
  });

  it('keeps the share on narrow screens when the columns stay in a row', () => {
    expect(getContainerImageSizes(column(1, 4, false))).toBe('25vw');
  });

  it('leaves images outside a sized container alone', () => {
    expect(getContainerImageSizes(null)).toBeUndefined();
    expect(
      getContainerImageSizes({
        type: 'accordion',
        data: {},
        index: 0,
        count: 1,
      }),
    ).toBeUndefined();
  });
});
