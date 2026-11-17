import React, { useState } from 'react';
import { type DateValue } from 'react-aria-components';
import { getLocalTimeZone, now } from '@internationalized/date';
import {
  DatePicker,
  type DatePickerChangeValue,
  type DatePickerProps,
} from '../DatePicker/DatePicker';

export type DateTimePickerProps<T extends DateValue> = DatePickerProps<T>;

/**
 * A `DatePicker` for a date and a time. Its granularity defaults to minutes,
 * and when it has no value yet, picking a day in the calendar also fills in
 * the current time.
 */
export function DateTimePicker<T extends DateValue>({
  granularity = 'minute',
  value,
  defaultValue,
  onChange,
  ...props
}: DateTimePickerProps<T>) {
  const [uncontrolledValue, setUncontrolledValue] = useState<
    T | DatePickerChangeValue<T>
  >(defaultValue ?? null);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;

  const handleChange = (newValue: DatePickerChangeValue<T>) => {
    let nextValue = newValue;
    if (
      granularity !== 'day' &&
      !currentValue &&
      nextValue &&
      'hour' in nextValue
    ) {
      const currentTime = now(getLocalTimeZone());
      nextValue = nextValue.set({
        hour: currentTime.hour,
        minute: currentTime.minute,
        second: currentTime.second,
      }) as DatePickerChangeValue<T>;
    }
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
  };

  return (
    <DatePicker
      {...props}
      granularity={granularity}
      value={currentValue as T | null}
      onChange={handleChange}
    />
  );
}
