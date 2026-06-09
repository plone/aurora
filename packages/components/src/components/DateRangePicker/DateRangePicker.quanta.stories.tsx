import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form, type DateValue, type RangeValue } from 'react-aria-components';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { Button } from '../Button/Button.quanta';
import { DateRangePicker } from './DateRangePicker.quanta';

const sampleRange: RangeValue<DateValue> = {
  start: new CalendarDate(2026, 6, 9),
  end: new CalendarDate(2026, 6, 27),
};

const meta: Meta<typeof DateRangePicker> = {
  title: 'Quanta/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
  },
  tags: ['autodocs'],
  args: {
    label: 'Date range',
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => <DateRangePicker {...args} />,
  args: {
    label: 'Select a date range',
    description: 'Pick a start and end date',
  },
};

export const WithDefaultValue: Story = {
  render: (args: any) => <DateRangePicker {...args} />,
  args: {
    label: 'With default value',
    description: 'Uncontrolled component with a preset range',
    defaultValue: sampleRange,
  },
};

const ControlledExample = (args: any) => {
  const [value, setValue] = useState<RangeValue<DateValue> | null>(sampleRange);
  const start = today(getLocalTimeZone());

  return (
    <div className="flex flex-col gap-4">
      <DateRangePicker {...args} value={value} onChange={setValue} />
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
  args: {
    label: 'Controlled component',
    description: 'Value managed by parent component',
  },
};

export const Disabled: Story = {
  render: (args: any) => <DateRangePicker {...args} />,
  args: {
    label: 'Disabled picker',
    defaultValue: sampleRange,
    isDisabled: true,
  },
};

export const ReadOnly: Story = {
  render: (args: any) => <DateRangePicker {...args} />,
  args: {
    label: 'Read-only picker',
    defaultValue: sampleRange,
    isReadOnly: true,
  },
};

export const Invalid: Story = {
  render: (args: any) => <DateRangePicker {...args} />,
  args: {
    label: 'With error',
    isInvalid: true,
    errorMessage: 'Please select a valid date range.',
  },
};

export const Required: Story = {
  render: (args: any) => <DateRangePicker {...args} />,
  args: {
    label: 'Required field',
    description: 'This field is required',
    isRequired: true,
  },
};

export const NotResettable: Story = {
  render: (args: any) => <DateRangePicker {...args} />,
  args: {
    label: 'Non-resettable',
    description: 'No clear button available',
    defaultValue: sampleRange,
    resettable: false,
  },
};

const FormExample = () => (
  <Form className="flex flex-col items-start gap-4">
    <DateRangePicker
      startName="start-date"
      endName="end-date"
      label="Trip dates"
      description="Select your start and end date"
      isRequired
    />
    <Button type="submit" variant="primary">
      Submit
    </Button>
  </Form>
);

export const FormIntegration: Story = {
  render: FormExample,
};
