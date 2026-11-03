import React from 'react';
import {
  SwitchButton,
  SwitchField,
  type SwitchFieldProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { focusRing } from '../../utils';
import { Description, FieldError } from '../Field/Field';

export interface SwitchProps extends Omit<SwitchFieldProps, 'children'> {
  /** The label. */
  children: React.ReactNode;
  /** Explains what happens when the switch is on. */
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

const switchStyles = tv({
  base: 'group flex items-center gap-3 text-sm leading-6 text-quanta-denim transition',
  variants: {
    isDisabled: {
      true: `
        text-quanta-silver
        forced-colors:text-[GrayText]
      `,
    },
  },
});

// A thin track (the `before` pseudo-element) under a larger knob.
const trackStyles = tv({
  base: `
    relative h-4.5 w-7.5 shrink-0 cursor-default
    before:absolute before:inset-x-0 before:top-[3px] before:h-3 before:rounded-full
    before:transition before:duration-200 before:ease-in-out
  `,
  variants: {
    isSelected: {
      false: 'before:bg-quanta-silver',
      true: `
        before:bg-quanta-azure
        group-hover:before:bg-quanta-sapphire
        group-pressed:before:bg-quanta-sapphire
        forced-colors:before:bg-[Highlight]!
      `,
    },
    isDisabled: {
      true: `
        before:bg-quanta-smoke
        group-hover:before:bg-quanta-smoke
        forced-colors:before:bg-[GrayText]!
      `,
    },
  },
});

// Off, a white knob with a border. On, a sapphire ring around a white dot.
const handleStyles = tv({
  extend: focusRing,
  base: `
    absolute top-0 left-0 size-4.5 rounded-full border bg-quanta-air transition-all duration-200
    ease-in-out
  `,
  variants: {
    isSelected: {
      false: `
        translate-x-0 border-quanta-dolphin
        group-hover:border-quanta-sapphire
        group-pressed:border-2 group-pressed:border-quanta-cobalt
      `,
      true: `
        translate-x-3 border-[6px] border-quanta-sapphire
        group-hover:border-quanta-royal
        group-pressed:border-quanta-cobalt
      `,
    },
    isDisabled: {
      true: `
        border-quanta-smoke
        group-hover:border-quanta-smoke
        forced-colors:border-[GrayText]
      `,
    },
  },
  compoundVariants: [
    {
      isSelected: false,
      isDisabled: true,
      class: 'bg-quanta-smoke',
    },
  ],
});

/**
 * An on/off control for a setting, with an optional description below its
 * label. Built on React Aria's `SwitchField` and `SwitchButton`.
 */
export function Switch({
  children,
  description,
  errorMessage,
  ...props
}: SwitchProps) {
  return (
    <SwitchField {...props} className="group flex flex-col gap-1">
      <SwitchButton
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            switchStyles({ ...renderProps, className }),
        )}
      >
        {(renderProps) => (
          <>
            <div className={trackStyles(renderProps)}>
              <span className={handleStyles(renderProps)} />
            </div>
            {children}
          </>
        )}
      </SwitchButton>
      <FieldError>{errorMessage}</FieldError>
      {description && <Description>{description}</Description>}
    </SwitchField>
  );
}
