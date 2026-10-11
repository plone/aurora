import React from 'react';
import {
  Button,
  type ButtonProps,
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
  type ValidationResult,
} from 'react-aria-components';
import { ChevrondownIcon, ChevronupIcon } from '@plone/icons';
import {
  Description,
  FieldError,
  FieldGroup,
  Input,
  Label,
} from '../Field/Field';
import { composeTailwindRenderProps } from '../../utils';

export interface NumberFieldProps extends AriaNumberFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
}

/**
 * A number input, with buttons to step the value up and down. It formats the
 * number in the user's locale, and parses what they type.
 */
export function NumberField({
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group flex flex-col gap-1',
      )}
    >
      {label && <Label>{label}</Label>}
      <FieldGroup>
        {(renderProps) => (
          <>
            <Input placeholder={placeholder} className="h-full" />
            <div
              className={
                renderProps.isDisabled
                  ? 'flex h-full flex-col text-quanta-silver'
                  : 'flex h-full flex-col'
              }
            >
              <StepperButton slot="increment">
                <ChevronupIcon aria-hidden size="sm" />
              </StepperButton>
              <StepperButton slot="decrement">
                <ChevrondownIcon aria-hidden size="sm" />
              </StepperButton>
            </div>
          </>
        )}
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaNumberField>
  );
}

function StepperButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      className={`
        flex flex-1 cursor-default items-center px-1.5 text-quanta-pigeon outline-0
        group-disabled:text-quanta-silver
        hover:text-quanta-space
        pressed:bg-quanta-smoke
      `}
    />
  );
}
