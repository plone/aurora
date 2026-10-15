import React, { useState } from 'react';
import { CalendarIcon, CloseIcon } from '@plone/icons';
import {
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue,
  type ValidationResult,
} from 'react-aria-components';
import { Button } from '../Button/Button';
import { Description, FieldError, FieldGroup, Label } from '../Field/Field';
import { composeTailwindRenderProps } from '../../utils';
import { Popover } from '../Popover/Popover';
import { Dialog } from '../Dialog/Dialog';
import { Calendar } from '../Calendar/Calendar';
import { DateInput } from '../DateInput/DateInput';

export interface DatePickerProps<
  T extends DateValue,
> extends AriaDatePickerProps<T> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  /**
   * Shows a button next to the field that clears the value.
   *
   * @default true
   */
  resettable?: boolean;
}

/** The value that `onChange` receives. */
export type DatePickerChangeValue<T extends DateValue> = Parameters<
  NonNullable<AriaDatePickerProps<T>['onChange']>
>[0];

export function DatePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  resettable = true,
  value,
  defaultValue,
  onChange,
  ...props
}: DatePickerProps<T>) {
  // The reset button clears the value, so the picker is always controlled.
  const [uncontrolledValue, setUncontrolledValue] = useState<
    T | DatePickerChangeValue<T>
  >(defaultValue ?? null);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;

  const handleChange = (newValue: DatePickerChangeValue<T>) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="flex items-center">
      <AriaDatePicker
        {...props}
        value={currentValue as T | null}
        onChange={handleChange}
        className={composeTailwindRenderProps(
          props.className,
          'group flex flex-col gap-1',
        )}
      >
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2">
          <FieldGroup className="w-auto min-w-[208px]">
            <DateInput className="flex h-10 min-w-[150px] flex-1 items-center text-sm" />
            <Button
              variant="icon"
              className="mr-1 w-7 rounded-xs outline-offset-0"
            >
              <CalendarIcon aria-hidden className="h-4 w-4" />
            </Button>
          </FieldGroup>
          {resettable && (
            <Button
              variant="icon"
              className="h-7 w-7 flex-shrink-0 p-1"
              onPress={() => handleChange(null)}
              isDisabled={props.isDisabled || !currentValue || props.isReadOnly}
              aria-label="Clear date and time"
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
            <Calendar />
          </Dialog>
        </Popover>
      </AriaDatePicker>
    </div>
  );
}
