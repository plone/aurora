import React from 'react';
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from 'react-aria-components';
import {
  Description,
  FieldError,
  TextArea,
  Label,
  inputStyles,
} from '../Field/Field';
import { composeTailwindRenderProps } from '../../utils';

export interface TextAreaFieldProps extends AriaTextFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
}

export function TextAreaField({
  label,
  description,
  errorMessage,
  ...props
}: TextAreaFieldProps) {
  return (
    <AriaTextField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group flex flex-col gap-1',
      )}
    >
      {label && <Label>{label}</Label>}
      <TextArea className={inputStyles} />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
