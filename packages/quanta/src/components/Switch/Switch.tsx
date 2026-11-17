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

// A pill-shaped track that fills with color when on. The off fill (dolphin)
// gives the track 3:1 contrast against white on its own (WCAG 1.4.11), so it
// needs no outline. The transparent border keeps the size stable and shows up
// in forced-colors mode.
const trackStyles = tv({
  extend: focusRing,
  base: `
    relative flex h-6 w-11 shrink-0 cursor-default items-center rounded-full border px-0.5
    transition duration-200 ease-in-out
  `,
  variants: {
    isSelected: {
      false: `
        border-transparent bg-quanta-dolphin
        group-hover:bg-quanta-pigeon
        group-pressed:bg-quanta-iron
      `,
      true: `
        border-quanta-royal bg-quanta-sapphire
        group-hover:bg-quanta-royal
        group-pressed:bg-quanta-royal
        forced-colors:bg-[Highlight]!
      `,
    },
    isDisabled: {
      true: `
        border-transparent bg-quanta-smoke
        group-hover:bg-quanta-smoke
        forced-colors:bg-[GrayText]!
      `,
    },
  },
});

// A white knob with a soft shadow that slides to the end when on.
const handleStyles = tv({
  base: `
    size-4.5 rounded-full bg-quanta-air shadow-md shadow-quanta-denim/30 transition-transform
    duration-200 ease-in-out
    forced-colors:bg-[ButtonText]
  `,
  variants: {
    isSelected: {
      false: 'translate-x-0',
      true: `
        translate-x-5
        forced-colors:bg-[HighlightText]
      `,
    },
    isDisabled: {
      true: 'shadow-none',
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
      {/* Line up with the label: track width (w-11) plus the gap (gap-3). */}
      <FieldError className="ps-14">{errorMessage}</FieldError>
      {description && (
        <Description className="ps-14">{description}</Description>
      )}
    </SwitchField>
  );
}
