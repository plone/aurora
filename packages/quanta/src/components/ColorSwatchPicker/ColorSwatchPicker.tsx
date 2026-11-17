import React from 'react';
import {
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
  type ColorSwatchPickerItemProps,
  type ColorSwatchPickerProps,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { focusRing } from '../../utils';
import { ColorSwatch } from '../ColorSwatch/ColorSwatch';

const pickerStyles = tv({
  base: 'flex gap-1',
  variants: {
    layout: {
      stack: 'flex-col',
      grid: 'flex-wrap',
    },
  },
});

export function ColorSwatchPicker({
  children,
  ...props
}: Omit<ColorSwatchPickerProps, 'layout'>) {
  return (
    <AriaColorSwatchPicker
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        pickerStyles({ ...renderProps, className }),
      )}
    >
      {children}
    </AriaColorSwatchPicker>
  );
}

const itemStyles = tv({
  extend: focusRing,
  base: `
    relative rounded-md
    [-webkit-tap-highlight-color:transparent]
  `,
});

export function ColorSwatchPickerItem(props: ColorSwatchPickerItemProps) {
  return (
    <AriaColorSwatchPickerItem {...props} className={itemStyles}>
      {({ isSelected }) => (
        <>
          <ColorSwatch />
          {isSelected && (
            <div
              className={`
                absolute inset-0 box-border rounded-md border-2 border-quanta-space outline-2
                -outline-offset-4 outline-quanta-air forced-color-adjust-none
              `}
            />
          )}
        </>
      )}
    </AriaColorSwatchPickerItem>
  );
}
