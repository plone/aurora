import {
  type CalendarDate,
  type DateValue,
  getLocalTimeZone,
  parseAbsolute,
  parseDate,
  toCalendarDate,
  toZoned,
  type ZonedDateTime,
} from '@internationalized/date';

// Plone's content API stores dates as ISO strings: `YYYY-MM-DD` for dates,
// and date-times in UTC. The Quanta date controls work with React Aria's date
// values. The widgets convert between them with these helpers, and show
// date-times in the browser's time zone.

/** Converts an ISO date (`YYYY-MM-DD`) to a date value. */
export function isoDateToDateValue(
  value: string | null | undefined,
): CalendarDate | null {
  if (!value) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

/** Converts a date value to an ISO date (`YYYY-MM-DD`). */
export function dateValueToIsoDate(value: DateValue | null): string | null {
  return value ? toCalendarDate(value).toString() : null;
}

/**
 * Converts an ISO date-time with an offset, such as Plone's UTC date-times,
 * to a date value in the given time zone, by default the browser's.
 */
export function isoDateTimeToDateValue(
  value: string | null | undefined,
  timeZone: string = getLocalTimeZone(),
): ZonedDateTime | null {
  if (!value) return null;
  try {
    return parseAbsolute(value, timeZone);
  } catch {
    return null;
  }
}

/**
 * Converts a date value to an ISO date-time in UTC. A value without a time
 * zone is read in the given time zone, by default the browser's.
 */
export function dateValueToIsoDateTime(
  value: DateValue | null,
  timeZone: string = getLocalTimeZone(),
): string | null {
  if (!value) return null;
  return 'timeZone' in value
    ? value.toAbsoluteString()
    : toZoned(value, timeZone).toAbsoluteString();
}
