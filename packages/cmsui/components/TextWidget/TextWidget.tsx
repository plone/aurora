import type { FormWidgetProps } from '@plone/types';
import { TextField } from '@plone/quanta';

export type TextWidgetProps = FormWidgetProps<string>;

/**
 * Adapts the widget contract to the Quanta `TextField` control. It is the
 * default widget for fields without a more specific one.
 */
export function TextWidget({
  name,
  value,
  onChange,
  onBlur,
  label,
  description,
  placeholder,
  required,
  disabled,
  readOnly,
  invalid,
  errorMessage,
  className,
}: TextWidgetProps) {
  return (
    <TextField
      name={name}
      // The control is controlled: an empty value is an empty string.
      value={value == null ? '' : String(value)}
      onChange={onChange}
      onBlur={onBlur}
      label={label}
      description={description}
      placeholder={placeholder}
      isRequired={required}
      isDisabled={disabled}
      isReadOnly={readOnly}
      isInvalid={invalid}
      errorMessage={errorMessage}
      // Validation is the form's job, not the browser's.
      validationBehavior="aria"
      className={className}
    />
  );
}

TextWidget.displayName = 'TextWidget';
