import { describe, expect, it } from 'vitest';

import { getColumnDropIndex } from './grid-column-drag';

describe('getColumnDropIndex', () => {
  it('drops after a column on its right side', () => {
    expect(getColumnDropIndex(0, 2, 'right')).toBe(2);
    expect(getColumnDropIndex(0, 1, 'right')).toBe(1);
  });

  it('drops before a column on its left side', () => {
    expect(getColumnDropIndex(2, 0, 'left')).toBe(0);
    expect(getColumnDropIndex(0, 2, 'left')).toBe(1);
  });

  it('keeps a column dropped next to itself in place', () => {
    expect(getColumnDropIndex(1, 1, 'left')).toBe(1);
    expect(getColumnDropIndex(1, 0, 'right')).toBe(1);
  });
});
