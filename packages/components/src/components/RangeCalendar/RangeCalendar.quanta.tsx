import React from 'react';
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  type DateValue,
  RangeCalendar as RACRangeCalendar,
  type RangeCalendarProps as RACRangeCalendarProps,
  Text,
} from 'react-aria-components';
import {
  CalendarGridHeader,
  CalendarHeader,
} from '../Calendar/Calendar.quanta';
import { tv } from 'tailwind-variants';
import { focusRing } from '../utils';

const capDay = `
  bg-quanta-sapphire text-quanta-air group-invalid:bg-quanta-candy
  forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
  forced-colors:group-invalid:bg-[Mark]
`;

const cellStyles = tv({
  extend: focusRing,
  base: `
    flex h-9 w-9 cursor-default items-center justify-center rounded-full text-sm text-quanta-iron
    forced-color-adjust-none
  `,
  variants: {
    isSelected: {
      false: `
        group-hover:bg-quanta-snow
        group-pressed:bg-quanta-smoke
      `,
    },
    isSelectionStart: { true: capDay },
    isSelectionEnd: { true: capDay },
    isDisabled: {
      true: `
        text-quanta-silver
        forced-colors:text-[GrayText]
      `,
    },
  },
  compoundVariants: [
    {
      isSelected: true,
      isSelectionStart: false,
      isSelectionEnd: false,
      class: `
        group-hover:bg-quanta-sky
        group-invalid:group-hover:bg-quanta-flamingo
        group-pressed:bg-quanta-cobalt
        group-invalid:group-pressed:bg-quanta-poppy
        forced-colors:group-hover:bg-[Highlight] forced-colors:group-invalid:group-hover:bg-[Mark]
      `,
    },
  ],
});

export interface RangeCalendarProps<T extends DateValue>
  extends RACRangeCalendarProps<T> {
  errorMessage?: string;
}

export function RangeCalendar<T extends DateValue>({
  errorMessage,
  ...props
}: RangeCalendarProps<T>) {
  return (
    <RACRangeCalendar {...props}>
      <CalendarHeader />
      <CalendarGrid
        className={`
          [&_td]:px-0
          [&_td:first-child_[data-selected]]:rounded-s-full
          [&_td:last-child_[data-selected]]:rounded-e-full
        `}
      >
        <CalendarGridHeader />
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className={`
                group h-9 w-9 cursor-default text-sm outline-0
                selected:bg-quanta-arctic
                forced-colors:selected:bg-[Highlight]
                selection-start:rounded-s-full
                selection-end:rounded-e-full
              `}
            >
              {({ formattedDate, ...renderProps }) => (
                <span className={cellStyles(renderProps)}>{formattedDate}</span>
              )}
            </CalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>

      {errorMessage && (
        <Text
          slot="errorMessage"
          className={`
            text-xs font-normal text-quanta-candy
            forced-colors:text-[Mark]
          `}
        >
          {errorMessage}
        </Text>
      )}
    </RACRangeCalendar>
  );
}
