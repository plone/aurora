import { Checkbox, Description } from '@plone/quanta';

export interface BooleanWidgetProps {
  name: string;
  value?: boolean | null;
  defaultValue?: boolean | null;
  onChange?: (value: boolean) => void;
  onBlur?: () => void;
  label?: string;
  description?: string;
  errorMessage?: string;
  errors?: unknown[];
  error?: unknown[];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

const getErrorMessage = ({
  errorMessage,
  errors,
  error,
}: Pick<BooleanWidgetProps, 'errorMessage' | 'errors' | 'error'>) =>
  errorMessage ??
  (errors ?? error)
    ?.filter(Boolean)
    .map((value) => String(value))
    .join(', ');

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
  errors,
  error,
  required,
  disabled,
  readOnly,
  className,
}: BooleanWidgetProps) {
  const resolvedErrorMessage = getErrorMessage({
    errorMessage,
    errors,
    error,
  });
  const descriptionId = description ? `${name}-description` : undefined;

  return (
    <div className={className}>
      <Checkbox
        name={name}
        isSelected={!!(value ?? defaultValue)}
        isRequired={required}
        isDisabled={disabled}
        isReadOnly={readOnly}
        isInvalid={!!resolvedErrorMessage}
        onBlur={onBlur}
        onChange={onChange}
        aria-describedby={descriptionId}
      >
        {label}
      </Checkbox>
      {description && (
        <Description id={descriptionId}>{description}</Description>
      )}
      {resolvedErrorMessage && (
        <p
          className={`
            text-xs font-normal text-quanta-candy
            forced-colors:text-[Mark]
          `}
        >
          {resolvedErrorMessage}
        </p>
      )}
    </div>
  );
}

BooleanWidget.displayName = 'BooleanWidget';
