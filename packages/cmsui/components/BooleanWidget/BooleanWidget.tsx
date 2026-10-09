import type { FormWidgetProps } from '@plone/types';
import { Checkbox, Description } from '@plone/quanta';

export type BooleanWidgetProps = FormWidgetProps<boolean>;

/**
 * Adapts the schema field props (`label`, `value`, `onChange(value)`) to the
 * Quanta `Checkbox` control.
 */
export function BooleanWidget({
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  label,
  description,
  errorMessage,
  invalid,
  required,
  disabled,
  readOnly,
  className,
}: BooleanWidgetProps) {
  const descriptionId = description ? `${name}-description` : undefined;

  return (
    <div className={className}>
      <Checkbox
        name={name}
        isSelected={!!(value ?? defaultValue)}
        isRequired={required}
        isDisabled={disabled}
        isReadOnly={readOnly}
        isInvalid={!!invalid}
        onBlur={onBlur}
        onChange={onChange}
        aria-describedby={descriptionId}
      >
        {label}
      </Checkbox>
      {description && (
        <Description id={descriptionId}>{description}</Description>
      )}
      {invalid && errorMessage && (
        <p
          className={`
            text-xs font-normal text-quanta-candy
            forced-colors:text-[Mark]
          `}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

BooleanWidget.displayName = 'BooleanWidget';
