import type { FormWidgetProps } from '@plone/types';
import { TextField, type TextFieldProps } from '@plone/quanta';

export type InputWidgetProps = FormWidgetProps<string>;

/**
 * Makes a widget that adapts the widget contract to the Quanta `TextField`
 * control with an input of the given type. The value is a string.
 */
function inputWidget(
  displayName: string,
  inputProps: Pick<TextFieldProps, 'type' | 'autoComplete' | 'inputMode'>,
) {
  function InputWidget({
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
  }: InputWidgetProps) {
    return (
      <TextField
        {...inputProps}
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
  InputWidget.displayName = displayName;
  return InputWidget;
}

/** An email address. */
export const EmailWidget = inputWidget('EmailWidget', {
  type: 'email',
  inputMode: 'email',
});

/**
 * A password. The browser doesn't fill it in with the editor's own
 * password.
 */
export const PasswordWidget = inputWidget('PasswordWidget', {
  type: 'password',
  autoComplete: 'new-password',
});

/** An absolute URL, such as `https://plone.org`. */
export const UrlWidget = inputWidget('UrlWidget', {
  type: 'url',
  inputMode: 'url',
});
