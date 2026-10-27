import React from 'react';
import {
  type FieldErrorProps,
  Group,
  type GroupProps,
  type InputProps,
  type TextAreaProps,
  type LabelProps,
  FieldError as RACFieldError,
  Input as RACInput,
  Label as RACLabel,
  Text,
  TextArea as RACTextArea,
  type TextProps,
  composeRenderProps,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import { composeTailwindRenderProps, focusRing } from '../../utils';

export function Label(props: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        `
          w-fit cursor-default text-xs font-medium text-quanta-pigeon
          group-data-disabled:text-quanta-silver
          group-data-invalid:text-quanta-candy
          after:bg-quanta-rose
          group-data-required:after:mx-1 group-data-required:after:inline-block
          group-data-required:after:h-1.5 group-data-required:after:w-1.5
          group-data-required:after:rounded-4xl
          not-group-data-invalid:not-group-data-readonly:has-[+input:focus]:text-quanta-sapphire
        `,
        props.className,
      )}
    />
  );
}

export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={twMerge(
        `
          text-xs font-normal text-quanta-pigeon
          group-data-disabled:text-quanta-silver
        `,
        props.className,
      )}
    />
  );
}

export function FieldError(props: FieldErrorProps) {
  return (
    <RACFieldError
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        `
          text-xs font-normal text-quanta-candy
          forced-colors:text-[Mark]
        `,
      )}
    />
  );
}

export const fieldBorderStyles = tv({
  variants: {
    isFocusWithin: {
      false: `forced-colors:border-[ButtonBorder]`,
      true: `
        bg-quanta-air inset-ring-quanta-cobalt outline-2
        group-data-readonly:inset-ring-0
        hover:bg-quanta-air
        forced-colors:border-[Highlight]
      `,
    },
    isInvalid: {
      true: `
        bg-quanta-ballet outline-2
        hover:bg-quanta-flamingo
        focus:inset-ring-quanta-rose
        forced-colors:border-[Mark]
      `,
    },
    isDisabled: {
      true: `
        bg-quanta-air text-quanta-silver inset-ring-1 inset-ring-quanta-smoke
        hover:bg-quanta-air
        forced-colors:border-[GrayText]
      `,
    },
  },
});

export const fieldGroupStyles = tv({
  extend: focusRing,
  base: `
    group flex h-12 items-center overflow-hidden rounded-md bg-quanta-snow text-quanta-space
    hover:bg-quanta-smoke
    read-only:hover:bg-quanta-air
    focus:bg-quanta-air
    active:bg-quanta-air
    forced-colors:bg-[Field]
  `,
  variants: {
    ...fieldBorderStyles.variants,
    isFocusWithin: {
      ...fieldBorderStyles.variants.isFocusWithin,
      true: twMerge(
        fieldBorderStyles.variants.isFocusWithin.true,
        `inset-ring-2`,
      ),
    },
    isInvalid: {
      ...fieldBorderStyles.variants.isInvalid,
      true: twMerge(
        fieldBorderStyles.variants.isInvalid.true,
        `focus:inset-ring-2`,
      ),
    },
  },
});

export function FieldGroup(props: GroupProps) {
  return (
    <Group
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        fieldGroupStyles({ ...renderProps, className }),
      )}
    />
  );
}

export const inputStyles = tv({
  extend: focusRing,
  base: 'rounded-md p-3 leading-6',
  variants: {
    isFocused: {
      ...fieldBorderStyles.variants.isFocusWithin,
      true: twMerge(
        fieldBorderStyles.variants.isFocusWithin.true,
        `inset-ring-2`,
      ),
    },
    isInvalid: {
      ...fieldBorderStyles.variants.isInvalid,
      true: twMerge(
        fieldBorderStyles.variants.isInvalid.true,
        `focus:inset-ring-2`,
      ),
    },
    isDisabled: fieldBorderStyles.variants.isDisabled,
  },
});

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        `
          min-w-0 flex-1 bg-quanta-snow px-2 py-1.5 text-sm text-quanta-space outline
          not-group-data-focus-within:outline-0
          group-data-focus-within:outline-0
          group-data-hovered:bg-quanta-smoke
          group-data-readonly:border group-data-readonly:border-dashed
          group-data-readonly:border-quanta-silver group-data-readonly:bg-quanta-air
          autofill:shadow-[inset_0_0_0_1000px_var(--quanta-arctic)]
          hover:bg-quanta-smoke
          group-data-readonly:hover:bg-quanta-air
          autofill:hover:shadow-[inset_0_0_0_1000px_var(--quanta-sky)]
          focus:bg-quanta-air
          active:bg-quanta-air
          disabled:cursor-not-allowed disabled:text-quanta-silver
        `,
      )}
    />
  );
}

export function TextArea(props: TextAreaProps) {
  return (
    <RACTextArea
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        `
          min-h-24 min-w-0 flex-1 resize-y bg-quanta-snow px-2 py-1.5 text-sm text-quanta-space
          outline
          not-group-data-focus-within:outline-0
          group-data-focus-within:outline-0
          group-data-hovered:bg-quanta-smoke
          group-data-readonly:border group-data-readonly:border-dashed
          group-data-readonly:border-quanta-silver group-data-readonly:bg-quanta-air
          autofill:shadow-[inset_0_0_0_1000px_var(--quanta-arctic)]
          hover:bg-quanta-smoke
          group-data-readonly:hover:bg-quanta-air
          autofill:hover:shadow-[inset_0_0_0_1000px_var(--quanta-sky)]
          focus:bg-quanta-air
          active:bg-quanta-air
          disabled:cursor-not-allowed disabled:text-quanta-silver
        `,
      )}
    />
  );
}
