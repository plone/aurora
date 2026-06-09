import React from 'react';
import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CalendarDate } from '@internationalized/date';
import { DateRangePicker } from './DateRangePicker.quanta';

expect.extend(toHaveNoViolations);

const sampleRange = {
  start: new CalendarDate(2026, 6, 9),
  end: new CalendarDate(2026, 6, 27),
};

it('DateRangePicker basic a11y test', async () => {
  const { container } = render(<DateRangePicker label="Event dates" />);

  expect(screen.getByText('Event dates')).toBeInTheDocument();

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

it('DateRangePicker with value a11y test', async () => {
  const { container } = render(
    <DateRangePicker
      label="Event dates"
      description="Pick a start and end date"
      defaultValue={sampleRange}
    />,
  );

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

it('DateRangePicker invalid a11y test', async () => {
  const { container } = render(
    <DateRangePicker
      label="Event dates"
      isInvalid
      errorMessage="Please select a valid date range."
    />,
  );

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});
