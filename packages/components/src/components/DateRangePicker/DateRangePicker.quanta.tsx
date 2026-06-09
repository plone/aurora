import React, { useCallback, useEffect, useState } from 'react';
import {
  DateRangePicker as RACDateRangePicker,
  type DateRangePickerProps as RACDateRangePickerProps,
  type DateValue,
  type RangeValue,
  type ValidationResult,
} from 'react-aria-components';
import {
  Description,
  FieldError,
  FieldGroup,
  Label,
} from '../Field/Field.quanta';
import { DateInput } from '../DateInput/DateInput.quanta';
import { Button } from '../Button/Button.quanta';
import { CalendarIcon, CloseIcon } from '../icons';
import { composeTailwindRenderProps } from '../utils';
import { Popover } from '../Popover/Popover.quanta';
import { Dialog } from '../Dialog/Dialog.quanta';
import { RangeCalendar } from '../RangeCalendar/RangeCalendar.quanta';

export interface DateRangePickerProps
  extends RACDateRangePickerProps<DateValue> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  resettable?: boolean;
}

export function DateRangePicker({
  label,
  description,
  errorMessage,
  resettable = true,
  value,
  defaultValue,
  onChange,
  ...props
}: DateRangePickerProps) {
  const [internalValue, setInternalValue] =
    useState<RangeValue<DateValue> | null>(value ?? defaultValue ?? null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = useCallback(
    (next: RangeValue<DateValue> | null) => {
      setInternalValue(next);
      onChange?.(next);
    },
    [onChange],
  );

  const handleReset = useCallback(() => {
    setInternalValue(null);
    onChange?.(null);
  }, [onChange]);

  return (
    <RACDateRangePicker
      {...props}
      value={internalValue}
      onChange={handleChange}
      className={composeTailwindRenderProps(
        props.className,
        'group flex flex-col gap-1',
      )}
    >
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <FieldGroup className="w-auto min-w-[208px] gap-2">
          <div className="flex items-center gap-1">
            <DateInput
              slot="start"
              className="flex h-10 min-w-fit flex-1 items-center text-sm"
            />
            <span aria-hidden="true">–</span>
            <DateInput
              slot="end"
              className="ml-0 flex h-10 min-w-fit flex-1 items-center pl-0 text-sm"
            />
          </div>
          <Button
            variant="icon"
            aria-label="Open calendar"
            className="mr-1 w-7 rounded-xs outline-offset-0"
          >
            <CalendarIcon aria-hidden className="h-4 w-4" />
          </Button>
        </FieldGroup>
        {resettable && (
          <Button
            variant="icon"
            className="h-7 w-7 shrink-0 p-1"
            onPress={handleReset}
            isDisabled={props.isDisabled || !internalValue || props.isReadOnly}
            aria-label="Clear date range"
            slot={null}
          >
            <CloseIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover>
        <Dialog>
          <RangeCalendar />
        </Dialog>
      </Popover>
    </RACDateRangePicker>
  );
}
