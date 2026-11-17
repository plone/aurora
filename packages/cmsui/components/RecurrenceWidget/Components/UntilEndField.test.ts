import { describe, expect, it } from 'vitest';
import { toISODate } from './UntilEndField';

describe('toISODate', () => {
  it('pads single-digit months and days', () => {
    expect(toISODate(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(toISODate(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('keeps two-digit months and days', () => {
    expect(toISODate(new Date(2026, 11, 25))).toBe('2026-12-25');
  });
});
