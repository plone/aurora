import React from 'react';
import { expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CalendarDate } from '@internationalized/date';
import { RangeCalendar } from './RangeCalendar.quanta';

expect.extend(toHaveNoViolations);

const sampleRange = {
  start: new CalendarDate(2026, 6, 9),
  end: new CalendarDate(2026, 6, 27),
};

it('RangeCalendar basic a11y test', async () => {
  const { container } = render(<RangeCalendar aria-label="Event date range" />);

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

it('RangeCalendar with value a11y test', async () => {
  const { container } = render(
    <RangeCalendar aria-label="Event date range" defaultValue={sampleRange} />,
  );

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

it('RangeCalendar invalid a11y test', async () => {
  const { container } = render(
    <RangeCalendar
      aria-label="Event date range"
      isInvalid
      errorMessage="Please select a valid date range."
    />,
  );

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});
