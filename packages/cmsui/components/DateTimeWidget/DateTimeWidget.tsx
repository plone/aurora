import type { FormWidgetProps } from '@plone/types';
import { DateTimePicker } from '@plone/quanta';
import {
  dateValueToIsoDateTime,
  isoDateTimeToDateValue,
} from '../../helpers/dates';

export type DateTimeWidgetProps = FormWidgetProps<string | null>;

/**
 * Adapts the widget contract to the Quanta `DateTimePicker` control. The
 * value is an ISO 8601 date-time in UTC, as the content API stores it. The
 * control works with a date value in the browser's time zone.
 */
export function DateTimeWidget({
  name,
  value,
  onChange,
  onBlur,
  label,
  description,
  required,
  disabled,
  readOnly,
  invalid,
  errorMessage,
  className,
}: DateTimeWidgetProps) {
  return (
    <DateTimePicker
      name={name}
      value={isoDateTimeToDateValue(value)}
      onChange={(newValue) => onChange(dateValueToIsoDateTime(newValue))}
      onBlur={onBlur}
      label={label}
      description={description}
      isRequired={required}
      isDisabled={disabled}
      isReadOnly={readOnly}
      isInvalid={invalid}
      errorMessage={errorMessage}
      validationBehavior="aria"
      className={className}
    />
  );
}

DateTimeWidget.displayName = 'DateTimeWidget';
