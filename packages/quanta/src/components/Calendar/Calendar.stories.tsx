import React from 'react';
import { parseDate } from '@internationalized/date';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './Calendar';

const meta = {
  title: 'Quanta/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    'aria-label': 'Event date',
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: parseDate('2026-01-15'),
  },
};

export const MinMax: Story = {
  args: {
    defaultValue: parseDate('2026-01-15'),
    minValue: parseDate('2026-01-10'),
    maxValue: parseDate('2026-01-25'),
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: parseDate('2026-01-15'),
    isDisabled: true,
  },
};

export const WithError: Story = {
  render: (args) => <Calendar {...args} />,
  args: {
    defaultValue: parseDate('2026-01-15'),
    isInvalid: true,
    errorMessage: 'Pick a weekday.',
  },
};
