import { describe, expect, it } from 'vitest';
import { isDateSet, isExpired, isScheduled } from './dates';

const now = new Date('2026-10-27T12:00:00Z');

describe('isDateSet', () => {
  it('is true for a date string', () => {
    expect(isDateSet('2026-10-27T12:00:00+00:00')).toBe(true);
  });

  it.each([['None'], [null], [undefined], ['']])(
    'is false for an unset date (%s)',
    (value) => {
      expect(isDateSet(value)).toBe(false);
    },
  );
});

describe('isExpired', () => {
  it('is true for a past expiration date', () => {
    expect(isExpired('2020-01-01T00:00:00+00:00', now)).toBe(true);
  });

  it('is false for a future expiration date', () => {
    expect(isExpired('2030-01-01T00:00:00+00:00', now)).toBe(false);
  });

  it.each([['None'], [null], [undefined]])(
    'is false when no expiration date is set (%s)',
    (value) => {
      expect(isExpired(value, now)).toBe(false);
    },
  );
});

describe('isScheduled', () => {
  it('is true for a future effective date', () => {
    expect(isScheduled('2030-01-01T00:00:00+00:00', now)).toBe(true);
  });

  it('is false for a past effective date', () => {
    expect(isScheduled('2020-01-01T00:00:00+00:00', now)).toBe(false);
  });

  it.each([['None'], [null], [undefined]])(
    'is false when no effective date is set (%s)',
    (value) => {
      expect(isScheduled(value, now)).toBe(false);
    },
  );
});
