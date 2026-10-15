import { describe, expect, it } from 'vitest';
import {
  CalendarDate,
  CalendarDateTime,
  parseAbsolute,
} from '@internationalized/date';
import {
  dateValueToIsoDate,
  dateValueToIsoDateTime,
  isoDateTimeToDateValue,
  isoDateToDateValue,
} from './dates';

describe('ISO dates', () => {
  it('convert to a date value and back', () => {
    const value = isoDateToDateValue('2026-10-09');
    expect(value).toEqual(new CalendarDate(2026, 10, 9));
    expect(dateValueToIsoDate(value)).toBe('2026-10-09');
  });

  it('drop the time of a date-time', () => {
    expect(dateValueToIsoDate(new CalendarDateTime(2026, 10, 9, 23, 30))).toBe(
      '2026-10-09',
    );
  });

  it('are empty without a valid value', () => {
    expect(isoDateToDateValue(null)).toBeNull();
    expect(isoDateToDateValue('')).toBeNull();
    expect(isoDateToDateValue('not a date')).toBeNull();
    expect(dateValueToIsoDate(null)).toBeNull();
  });
});

describe('ISO date-times', () => {
  it('show a UTC date-time in the given time zone', () => {
    const value = isoDateTimeToDateValue(
      '2026-01-15T15:00:00+00:00',
      'Europe/Madrid',
    );
    expect(value?.hour).toBe(16);
    expect(value?.timeZone).toBe('Europe/Madrid');
  });

  it('store a zoned date-time in UTC', () => {
    expect(
      dateValueToIsoDateTime(
        parseAbsolute('2026-01-15T15:00:00Z', 'Europe/Madrid'),
      ),
    ).toBe('2026-01-15T15:00:00.000Z');
  });

  it('read a date-time without a time zone in the given one', () => {
    expect(
      dateValueToIsoDateTime(
        new CalendarDateTime(2026, 1, 15, 16, 0),
        'Europe/Madrid',
      ),
    ).toBe('2026-01-15T15:00:00.000Z');
  });

  it('are empty without a valid value', () => {
    expect(isoDateTimeToDateValue(null)).toBeNull();
    expect(isoDateTimeToDateValue('2026-01-15T15:00:00')).toBeNull();
    expect(dateValueToIsoDateTime(null)).toBeNull();
  });
});
