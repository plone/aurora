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
  base: 'group flex items-center gap-2 text-sm text-quanta-space transition',
  variants: {
    isDisabled: {
      true: `
        text-quanta-silver
        forced-colors:text-[GrayText]
      `,
    },
  },
});

const trackStyles = tv({
  extend: focusRing,
  base: `
    flex h-5 w-9 shrink-0 cursor-default items-center rounded-full border border-transparent px-0.5
    transition duration-200 ease-in-out
  `,
  variants: {
    isSelected: {
      false: `
        bg-quanta-silver
        group-pressed:bg-quanta-dolphin
      `,
      true: `
        bg-quanta-sapphire
        group-pressed:bg-quanta-royal
        forced-colors:bg-[Highlight]!
      `,
    },
    isDisabled: {
      true: `
        bg-quanta-smoke
        forced-colors:border-[GrayText] forced-colors:group-selected:bg-[GrayText]!
      `,
    },
  },
});

const handleStyles = tv({
  base: `
    h-3.5 w-3.5 transform rounded-full bg-quanta-air shadow-xs outline -outline-offset-1
    outline-transparent transition duration-200 ease-in-out
  `,
  variants: {
    isSelected: {
      false: 'translate-x-0',
      true: 'translate-x-4',
    },
    isDisabled: {
      true: 'forced-colors:outline-[GrayText]',
    },
  },
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
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </SwitchField>
  );
}
