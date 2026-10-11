import React from 'react';
import {
  ToggleButton as RACToggleButton,
  ToggleButtonGroup as RACToggleButtonGroup,
  type ToggleButtonGroupProps as RACToggleButtonGroupProps,
  type ToggleButtonProps as RACToggleButtonProps,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { composeTailwindRenderProps, focusRing } from '../../utils';

export type ToggleButtonProps = RACToggleButtonProps;
export type ToggleButtonGroupProps = RACToggleButtonGroupProps;

const toggleButtonStyles = tv({
  extend: focusRing,
  base: `
    relative inline-flex cursor-default items-center justify-center gap-1.5 px-3 py-1.5 text-sm
    font-medium text-quanta-iron transition
    hover:bg-quanta-snow
    forced-colors:border-[ButtonBorder]
    pressed:bg-quanta-smoke
  `,
  variants: {
    isSelected: {
      true: `
        bg-quanta-arctic text-quanta-royal
        hover:bg-quanta-sky
        forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
        pressed:bg-quanta-sky
      `,
    },
    isDisabled: {
      true: `
        text-quanta-silver
        hover:bg-transparent
        forced-colors:text-[GrayText]
      `,
    },
  },
});

/** A button that stays on or off. Inside a `ToggleButtonGroup`, a segment. */
export function ToggleButton(props: ToggleButtonProps) {
  return (
    <RACToggleButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        toggleButtonStyles({ ...renderProps, className }),
      )}
    />
  );
}

/**
 * A set of toggle buttons shown as one segmented control. With
 * `selectionMode="single"` it works like a compact radio group, e.g. for
 * filters: "All · Custom · Not addable".
 */
export function ToggleButtonGroup(props: ToggleButtonGroupProps) {
  return (
    <RACToggleButtonGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        `
          inline-flex overflow-hidden rounded-md border border-quanta-silver bg-quanta-air
          *:not-last:border-r *:not-last:border-quanta-silver
          data-[orientation=vertical]:flex-col data-[orientation=vertical]:*:not-last:border-r-0
          data-[orientation=vertical]:*:not-last:border-b
        `,
      )}
    />
  );
}
