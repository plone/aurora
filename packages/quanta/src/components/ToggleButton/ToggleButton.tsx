import React from 'react';
import {
  ToggleButton as RACToggleButton,
  type ToggleButtonProps,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { focusRing } from '../../utils';

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
