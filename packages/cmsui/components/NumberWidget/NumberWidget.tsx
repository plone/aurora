import type { FormWidgetProps } from '@plone/types';
import { NumberField } from '@plone/quanta';

export type NumberWidgetProps = FormWidgetProps<number | null>;

const asNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/**
 * Adapts the widget contract to the Quanta `NumberField` control, for
 * `number` and `integer` fields. The value is a number, or `null` when the
 * field is empty.
 *
 * It reads the schema's `minimum` and `maximum`, and only takes whole
 * numbers for an `integer` field.
 */
export function NumberWidget({
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
  schema,
}: NumberWidgetProps) {
  const integer = schema?.type === 'integer';

  return (
    <NumberField
      name={name}
      // The control is controlled: an empty value is `NaN`.
      value={asNumber(value) ?? NaN}
      onChange={(next) => onChange(Number.isNaN(next) ? null : next)}
      onBlur={onBlur}
      minValue={asNumber(schema?.minimum)}
      maxValue={asNumber(schema?.maximum)}
      step={integer ? 1 : undefined}
      formatOptions={
        integer ? { maximumFractionDigits: 0, useGrouping: false } : undefined
      }
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

NumberWidget.displayName = 'NumberWidget';
