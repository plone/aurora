import type { FormWidgetProps } from '@plone/types';
import { DatePicker } from '@plone/quanta';
import { dateValueToIsoDate, isoDateToDateValue } from '../../helpers/dates';

export type DateWidgetProps = FormWidgetProps<string | null>;

/**
 * Adapts the widget contract to the Quanta `DatePicker` control. The value
 * is an ISO date (`YYYY-MM-DD`), as the content API stores it, and the
 * control works with a date value.
 */
export function DateWidget({
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
}: DateWidgetProps) {
  return (
    <DatePicker
      name={name}
      value={isoDateToDateValue(value)}
      onChange={(newValue) => onChange(dateValueToIsoDate(newValue))}
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

DateWidget.displayName = 'DateWidget';
