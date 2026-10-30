import React from 'react';
import {
  ColorSwatch as AriaColorSwatch,
  type ColorSwatchProps,
} from 'react-aria-components';
import { composeTailwindRenderProps } from '../../utils';

export function ColorSwatch(props: ColorSwatchProps) {
  return (
    <AriaColorSwatch
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'box-border size-8 rounded-md border border-quanta-space/10',
      )}
      // The checkerboard shows through transparent colors.
      style={({ color }) => ({
        background: `linear-gradient(${color}, ${color}),
          repeating-conic-gradient(var(--quanta-silver) 0% 25%, var(--quanta-air) 0% 50%) 50% / 16px 16px`,
      })}
    />
  );
}
