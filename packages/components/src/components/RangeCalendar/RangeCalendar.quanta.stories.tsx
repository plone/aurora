import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type DateValue, type RangeValue } from 'react-aria-components';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { Button } from '../Button/Button.quanta';
import { RangeCalendar } from './RangeCalendar.quanta';

const sampleRange: RangeValue<DateValue> = {
  start: new CalendarDate(2026, 6, 9),
  end: new CalendarDate(2026, 6, 27),
};

const meta: Meta<typeof RangeCalendar> = {
  title: 'Quanta/RangeCalendar',
  component: RangeCalendar,
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RangeCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => <RangeCalendar {...args} />,
};

export const WithDefaultValue: Story = {
  render: (args: any) => <RangeCalendar {...args} />,
  args: {
    defaultValue: sampleRange,
  },
};

const ControlledExample = (args: any) => {
  const [value, setValue] = useState<RangeValue<DateValue> | null>(sampleRange);
  const start = today(getLocalTimeZone());

  return (
    <div className="flex flex-col gap-4">
      <RangeCalendar {...args} value={value} onChange={setValue} />
      <div className="text-sm text-gray-600">
        Current value:{' '}
        {value ? `${value.start.toString()} – ${value.end.toString()}` : 'null'}
      </div>
      <div className="flex gap-2">
        <Button
          variant="neutral"
          onPress={() => setValue({ start, end: start.add({ weeks: 1 }) })}
        >
          Next 7 days
        </Button>
        <Button variant="neutral" onPress={() => setValue(null)}>
          Clear
        </Button>
      </div>
    </div>
  );
};

export const Controlled: Story = {
  render: ControlledExample,
};

export const Disabled: Story = {
  render: (args: any) => <RangeCalendar {...args} />,
  args: {
    defaultValue: sampleRange,
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  render: (args: any) => <RangeCalendar {...args} />,
  args: {
    defaultValue: sampleRange,
    isReadOnly: true,
  },
};

export const Invalid: Story = {
  render: (args: any) => <RangeCalendar {...args} />,
  args: {
    isInvalid: true,
    errorMessage: 'Please select a valid date range.',
    defaultValue: sampleRange,
  },
};
