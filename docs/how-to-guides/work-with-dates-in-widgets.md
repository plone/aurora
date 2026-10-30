---
myst:
  html_meta:
    'description': "Convert Plone's ISO dates and date-times to React Aria date values and back in Plone Aurora widgets"
    'property=og:description': "Convert Plone's ISO dates and date-times to React Aria date values and back in Plone Aurora widgets"
    'property=og:title': 'Work with dates in widgets'
    'keywords': 'Plone Aurora, forms, widgets, dates, date-times, time zones, ISO 8601, DateValue, React Aria, @internationalized/date, Quanta, DatePicker'
---

(work-with-dates-in-widgets-label)=

# Work with dates in widgets

Plone's content API and the Quanta date controls represent dates differently.
The content API stores dates and date-times as ISO 8601 strings.
The Quanta date controls, such as `DatePicker`, work with date values from React Aria's `@internationalized/date` library.

A widget converts between them.
This guide shows how, with the date helpers of `@plone/cmsui`, and how to use `@internationalized/date` for everything else, such as limits, today's date, and formatting.
For the concepts behind controls and widgets, see {ref}`form-fields-controls-and-widgets-label`.

## The two representations

Plone stores two kinds of dates.

A date
: A day without a time, such as a `Date` field in a content type schema.
The content API reads and writes it as `YYYY-MM-DD`, for example `"2026-10-05"`.

A date-time
: A moment in time, such as an event's start or a content item's publishing date.
The content API writes it in UTC, with its offset, for example `"2026-10-05T10:00:00+00:00"`.

The Quanta date controls take a `DateValue`, which is one of three classes from `@internationalized/date`.

`CalendarDate`
: A day without a time.
It matches Plone's dates.

`CalendarDateTime`
: A day and a time, without a time zone.

`ZonedDateTime`
: A day and a time in a time zone, which makes it a moment in time.
It matches Plone's date-times.

These classes are immutable, and handle calendars, time zones, and daylight saving time correctly.
JavaScript's `Date` does neither reliably, so don't use it to convert values.

The controls are generic over the value type: `DatePicker`, `DateField`, `DateTimePicker`, and `Calendar` return the same kind of value that you give them.
A `DatePicker` with a `CalendarDate` returns a `CalendarDate`, and a `DateTimePicker` with a `ZonedDateTime` returns a `ZonedDateTime`.
A cleared control returns `null`.

```{note}
The conversion belongs in the widget, not in the control.
`@plone/quanta` doesn't know Plone's formats, and doesn't depend on any Plone package except `@plone/icons`.
```

## The date helpers

`@plone/cmsui` provides four helpers in `@plone/cmsui/helpers/dates`.
The core date widgets use them, and your widgets can too.

| Helper                                     | Converts                        | Into                            |
| ------------------------------------------ | ------------------------------- | ------------------------------- |
| `isoDateToDateValue(value)`                | an ISO date, `YYYY-MM-DD`       | a `CalendarDate`                |
| `dateValueToIsoDate(value)`                | any `DateValue`                 | an ISO date, `YYYY-MM-DD`       |
| `isoDateTimeToDateValue(value, timeZone?)` | an ISO date-time with an offset | a `ZonedDateTime` in `timeZone` |
| `dateValueToIsoDateTime(value, timeZone?)` | any `DateValue`                 | an ISO date-time in UTC         |

All four accept an empty value, `null` or `undefined`, and return `null` for it.
The helpers that read a string also return `null` when the string isn't valid, instead of throwing, so a malformed stored value shows as an empty control.

`timeZone` is an IANA time zone name, such as `"Europe/Madrid"`.
It defaults to the browser's time zone.

`isoDateTimeToDateValue`
: Reads the moment in time, then shows it in `timeZone`.
`"2026-10-05T10:00:00+00:00"` becomes 12:00 on 5 October in `Europe/Madrid`, which is two hours ahead of UTC in summer.
The string must have an offset, such as `+00:00` or `Z`.
A date-time without one doesn't say which moment it is, so the helper returns `null`.

`dateValueToIsoDateTime`
: Writes a `ZonedDateTime` as the same moment in UTC, in the form `"2026-10-05T10:00:00.000Z"`.
The content API accepts it, and returns it as `"2026-10-05T10:00:00+00:00"`.
A `CalendarDate` or a `CalendarDateTime` has no time zone, so it's read in `timeZone` first.
A `CalendarDate` becomes midnight of that day.

`dateValueToIsoDate`
: Drops the time of a value that has one, and keeps its day.
The day is the one in the value's own time zone, not in UTC.

## Write a date widget

A widget for a Plone date converts the stored string to a `CalendarDate` for the control, and the control's value back to a string for `onChange`.
This is how the core `DateWidget` does it.

```ts
import type { FormWidgetProps } from '@plone/types';
import { DatePicker } from '@plone/quanta';
import {
  dateValueToIsoDate,
  isoDateToDateValue,
} from '@plone/cmsui/helpers/dates';

// The value can be cleared, so the widget emits `null` too.
type DateWidgetProps = FormWidgetProps<string | null>;
```

```tsx
function DateWidget({ value, onChange, label, required }: DateWidgetProps) {
  return (
    <DatePicker
      label={label}
      isRequired={required}
      value={isoDateToDateValue(value)}
      onChange={(newValue) => onChange(dateValueToIsoDate(newValue))}
    />
  );
}
```

The form never sees a date value.
It passes a string in, and receives a string or `null` back.

## Write a date-time widget

A widget for a Plone date-time converts the stored UTC string to a `ZonedDateTime` in the editor's time zone, and back to UTC on change.
The editor sees and edits local time, and Plone keeps storing UTC.

```ts
import type { FormWidgetProps } from '@plone/types';
import { DateTimePicker } from '@plone/quanta';
import {
  dateValueToIsoDateTime,
  isoDateTimeToDateValue,
} from '@plone/cmsui/helpers/dates';

type DateTimeWidgetProps = FormWidgetProps<string | null>;
```

```tsx
function DateTimeWidget({
  value,
  onChange,
  label,
  required,
}: DateTimeWidgetProps) {
  return (
    <DateTimePicker
      label={label}
      isRequired={required}
      value={isoDateTimeToDateValue(value)}
      onChange={(newValue) => onChange(dateValueToIsoDateTime(newValue))}
    />
  );
}
```

To show and edit the date-time in another time zone, such as the site's, pass it to both helpers.
Use the same time zone for both, or the value shifts every time the editor changes it.

```tsx
const timeZone = 'Europe/Madrid';

<DateTimePicker
  value={isoDateTimeToDateValue(value, timeZone)}
  onChange={(newValue) => onChange(dateValueToIsoDateTime(newValue, timeZone))}
/>;
```

## Use `@internationalized/date` for the rest

The helpers only convert to and from Plone's strings.
For anything else, use `@internationalized/date` directly.
It's already a dependency of `@plone/cmsui` and `@plone/quanta`; add it to your own package if your code imports it.

The functions you'll need most often are the following.

| Function                                      | Use                                                                |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `getLocalTimeZone()`                          | The browser's time zone name.                                      |
| `today(timeZone)`                             | Today, as a `CalendarDate`.                                        |
| `now(timeZone)`                               | The current moment, as a `ZonedDateTime`.                          |
| `parseDate(value)`                            | `YYYY-MM-DD` to a `CalendarDate`. It throws on an invalid string.  |
| `parseDateTime(value)`                        | `YYYY-MM-DDTHH:mm:ss`, without an offset, to a `CalendarDateTime`. |
| `parseAbsolute(value, timeZone)`              | A date-time with an offset to a `ZonedDateTime` in `timeZone`.     |
| `parseAbsoluteToLocal(value)`                 | The same, in the browser's time zone.                              |
| `toCalendarDate(value)`                       | Drops the time.                                                    |
| `toZoned(value, timeZone)`                    | Puts a value without a time zone in `timeZone`.                    |
| `toTimeZone(value, timeZone)`                 | Shows a `ZonedDateTime` as the same moment in another time zone.   |
| `isSameDay(a, b)`, `isToday(value, timeZone)` | Compares days.                                                     |

Date values also have methods.
`value.add({ days: 1 })`, `value.subtract({ months: 1 })`, and `value.set({ day: 1 })` return a new value, and `a.compare(b)` returns a negative number, zero, or a positive number.
`value.toString()` returns the ISO string, and `value.toDate(timeZone)` returns a JavaScript `Date`, for an API that needs one.

### Limit the dates

A control's `minValue` and `maxValue` take date values too, of the same kind as the control's value.
For example, the following picker only allows today or a later day.

```tsx
import { getLocalTimeZone, today } from '@internationalized/date';

<DatePicker
  label="Expires"
  minValue={today(getLocalTimeZone())}
  value={isoDateToDateValue(value)}
  onChange={(newValue) => onChange(dateValueToIsoDate(newValue))}
/>;
```

A limit that comes from the schema, such as a minimum stored as an ISO string, goes through the same helper as the value.

### Format a date for display

To show a date as text, outside a control, format it in the editor's locale with `useDateFormatter` from `react-aria`.
It takes the options of the browser's `Intl.DateTimeFormat`, and formats a JavaScript `Date`.

```tsx
import { getLocalTimeZone } from '@internationalized/date';
import { useDateFormatter } from 'react-aria';
import { isoDateTimeToDateValue } from '@plone/cmsui/helpers/dates';

function Modified({ value }: { value: string }) {
  const formatter = useDateFormatter({ dateStyle: 'long', timeStyle: 'short' });
  const date = isoDateTimeToDateValue(value);
  return date ? (
    <time dateTime={value}>
      {formatter.format(date.toDate(getLocalTimeZone()))}
    </time>
  ) : null;
}
```

The controls and the formatter use the locale of the nearest React Aria `I18nProvider`, or the browser's language when there's none.

## Test with a fixed time zone

A date-time widget shows a different time in every time zone, so pin the time zone in tests.
In Playwright, set the browser's time zone and locale for the test file.

```ts
test.use({ timezoneId: 'Europe/Madrid', locale: 'en-US' });
```

In unit tests, pass the time zone to the helpers instead of relying on the machine's.

```ts
expect(
  isoDateTimeToDateValue('2026-10-05T10:00:00+00:00', 'Europe/Madrid')?.hour,
).toBe(12);
```
