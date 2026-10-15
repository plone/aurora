import React from 'react';
import { ChevronrightIcon, ChevronleftIcon } from '@plone/icons';

import {
  Calendar as AriaCalendar,
  CalendarGridHeader as AriaCalendarGridHeader,
  type CalendarProps as AriaCalendarProps,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarHeading,
  type DateValue,
  Text,
  useLocale,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Button } from '../Button/Button';
import { composeTailwindRenderProps, focusRing } from '../../utils';

const cellStyles = tv({
  extend: focusRing,
  base: `
    m-px flex h-9 w-9 cursor-default items-center justify-center rounded-full text-sm
    forced-color-adjust-none
  `,
  variants: {
    isSelected: {
      false: `
        text-zinc-900
        hover:bg-gray-100
        dark:text-zinc-200 dark:hover:bg-zinc-700
        pressed:bg-gray-200
        dark:pressed:bg-zinc-600
      `,
      true: `
        bg-blue-600 text-white
        invalid:bg-red-600
        forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
        forced-colors:invalid:bg-[Mark]
      `,
    },
    isDisabled: {
      true: `
        text-gray-300
        dark:text-zinc-600
        forced-colors:text-[GrayText]
      `,
    },
  },
});

export interface CalendarProps<
  T extends DateValue,
> extends AriaCalendarProps<T> {
  errorMessage?: string;
}

export function Calendar<T extends DateValue>({
  errorMessage,
  ...props
}: CalendarProps<T>) {
  const months = props.visibleDuration?.months || 1;
  return (
    <AriaCalendar
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        months > 1 ? 'flex gap-6' : '',
      )}
    >
      {Array.from({ length: months }, (_, i) => (
        <div key={i}>
          <CalendarHeader
            offset={i}
            hasPrevious={i === 0}
            hasNext={i === months - 1}
          />
          <CalendarGrid offset={{ months: i }}>
            <CalendarGridHeader />
            <CalendarGridBody>
              {(date) => <CalendarCell date={date} className={cellStyles} />}
            </CalendarGridBody>
          </CalendarGrid>
        </div>
      ))}
      {errorMessage && (
        <Text slot="errorMessage" className="text-sm text-red-600">
          {errorMessage}
        </Text>
      )}
    </AriaCalendar>
  );
}

function CalendarHeader({
  offset,
  hasPrevious,
  hasNext,
}: {
  offset: number;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const { direction } = useLocale();

  return (
    <header className="flex w-full items-center gap-1 px-1 pb-4">
      {hasPrevious && (
        <Button slot="previous">
          {direction === 'rtl' ? (
            <ChevronrightIcon aria-hidden />
          ) : (
            <ChevronleftIcon aria-hidden />
          )}
        </Button>
      )}
      <CalendarHeading
        offset={{ months: offset }}
        className={`
          mx-2 flex-1 text-center text-xl font-semibold text-zinc-900
          dark:text-zinc-200
        `}
      />
      {hasNext && (
        <Button slot="next">
          {direction === 'rtl' ? (
            <ChevronleftIcon aria-hidden />
          ) : (
            <ChevronrightIcon aria-hidden />
          )}
        </Button>
      )}
    </header>
  );
}

export function CalendarGridHeader() {
  return (
    <AriaCalendarGridHeader>
      {(day) => (
        <CalendarHeaderCell className="text-xs font-semibold text-gray-500">
          {day}
        </CalendarHeaderCell>
      )}
    </AriaCalendarGridHeader>
  );
}
