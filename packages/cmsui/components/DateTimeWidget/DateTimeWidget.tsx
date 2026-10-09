import type { FormWidgetProps } from '@plone/types';
import { DateTimePicker } from '@plone/quanta';

export type DateTimeWidgetProps = FormWidgetProps<string | null>;

/**
 * Adapts the widget contract to the Quanta `DateTimePicker` control. The
 * value is an ISO 8601 string, as the content API stores it.
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
      value={value ?? null}
      onChange={onChange}
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
