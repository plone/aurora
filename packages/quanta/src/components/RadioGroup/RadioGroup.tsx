import React, { type ReactNode } from 'react';
import {
  composeRenderProps,
  RadioButton,
  RadioField,
  type RadioFieldProps,
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  type ValidationResult,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { composeTailwindRenderProps, focusRing } from '../../utils';
import { Description, FieldError, Label } from '../Field/Field';

export interface RadioGroupProps extends Omit<RACRadioGroupProps, 'children'> {
  label?: string;
  children?: ReactNode;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export function RadioGroup(props: RadioGroupProps) {
  return (
    <RACRadioGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group flex flex-col gap-2',
      )}
    >
      <Label>{props.label}</Label>
      <div
        className={`
          flex gap-2
          group-orientation-horizontal:gap-4
          group-orientation-vertical:flex-col
        `}
      >
        {props.children}
      </div>
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </RACRadioGroup>
  );
}

const styles = tv({
  extend: focusRing,
  base: `
    h-5 w-5 rounded-full border-2 bg-quanta-air transition-all
    dark:bg-zinc-900
  `,
  variants: {
    isSelected: {
      false: `
        border-quanta-dolphin
        group-pressed:border-quanta-pigeon
        dark:border-zinc-400 dark:group-pressed:border-zinc-300
      `,
      true: `
        border-[7px] border-quanta-iron
        group-pressed:border-quanta-denim
        dark:border-slate-300 dark:group-pressed:border-slate-200
        forced-colors:border-[Highlight]!
      `,
    },
    isInvalid: {
      true: `
        border-quanta-candy
        group-pressed:border-quanta-wine
        dark:border-red-600 dark:group-pressed:border-red-700
        forced-colors:border-[Mark]!
      `,
    },
    isDisabled: {
      true: `
        border-quanta-smoke
        dark:border-zinc-700
        forced-colors:border-[GrayText]!
      `,
    },
  },
});

export interface RadioProps extends RadioFieldProps {
  description?: string;
}

export function Radio(props: RadioProps) {
  return (
    <RadioField {...props} className="group flex flex-col gap-1">
      <RadioButton
        className={composeTailwindRenderProps(
          props.className,
          `
            group flex items-center gap-2 text-sm text-quanta-denim transition
            disabled:text-quanta-silver
            dark:text-zinc-200 dark:disabled:text-zinc-600
            forced-colors:disabled:text-[GrayText]
          `,
        )}
      >
        {composeRenderProps(props.children, (children, renderProps) => (
          <>
            <div className={styles(renderProps)} />
            {children}
          </>
        ))}
      </RadioButton>
      {props.description && (
        <Description className="ms-7">{props.description}</Description>
      )}
    </RadioField>
  );
}

const customRadioButton = tv({
  extend: focusRing,
  base: `
    flex h-10 w-10 cursor-pointer items-center justify-center rounded-md font-medium
    text-quanta-iron transition
  `,
  variants: {
    isSelected: {
      false: `
        bg-quanta-air
        hover:bg-quanta-sky
        focus:bg-quanta-snow
        active:bg-quanta-silver
      `,
      true: `
        bg-quanta-sky
        hover:bg-quanta-sky
        focus:bg-quanta-sky
        active:bg-quanta-sky
        pressed:bg-quanta-sky
      `,
    },
    isPressed: {
      true: 'pressed:bg-quanta-cobalt',
    },
    isInvalid: {
      true: `
        border border-quanta-candy text-quanta-candy
        dark:border-red-600 dark:text-red-600
      `,
    },
    isDisabled: {
      true: 'text-quanta-smoke',
    },
  },
});
export function CustomRadio(props: RadioProps) {
  return (
    <RadioField {...props} className="group flex flex-col gap-1">
      <RadioButton
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            customRadioButton({
              ...renderProps,
              className,
            }),
        )}
      >
        {props.children}
      </RadioButton>
      {props.description && <Description>{props.description}</Description>}
    </RadioField>
  );
}
