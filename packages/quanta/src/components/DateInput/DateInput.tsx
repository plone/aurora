import React from 'react';
import {
  DateInput as AriaDateInput,
  type DateInputProps as AriaDateInputProps,
  DateSegment,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { composeTailwindRenderProps } from '../../utils';

const segmentStyles = tv({
  base: `
    inline rounded-xs p-1 text-quanta-denim caret-transparent outline-0 forced-color-adjust-none
    dark:text-zinc-200
    forced-colors:text-[ButtonText]
    type-literal:px-0
  `,
  variants: {
    isPlaceholder: {
      true: `
        text-quanta-iron italic
        dark:text-zinc-400
      `,
    },
    isDisabled: {
      true: `
        text-quanta-smoke
        dark:text-zinc-600
        forced-colors:text-[GrayText]
      `,
    },
    isFocused: {
      true: `
        bg-quanta-sapphire text-quanta-air
        dark:text-white
        forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
      `,
    },
  },
});

export function DateInput(props: Omit<AriaDateInputProps, 'children'>) {
  return (
    <AriaDateInput
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'ml-1 flex h-10 min-w-[150px] flex-1 items-center pl-2',
      )}
    >
      {(segment) => <DateSegment segment={segment} className={segmentStyles} />}
    </AriaDateInput>
  );
}
