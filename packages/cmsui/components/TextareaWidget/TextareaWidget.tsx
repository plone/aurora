import type { FormWidgetProps } from '@plone/types';
import { TextAreaField } from '@plone/quanta';

export type TextareaWidgetProps = FormWidgetProps<string>;

/**
 * Adapts the widget contract to the Quanta `TextAreaField` control, for
 * multi-line text such as a page's summary.
 */
export function TextareaWidget({
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
}: TextareaWidgetProps) {
  return (
    <TextAreaField
      name={name}
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
      validationBehavior="aria"
      className={className}
    />
  );
}

TextareaWidget.displayName = 'TextareaWidget';
