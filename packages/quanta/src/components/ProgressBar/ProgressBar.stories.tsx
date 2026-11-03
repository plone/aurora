import React from 'react';
import { ProgressBar } from './ProgressBar';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  args: {
    label: 'Changing workflow…',
    value: 40,
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Indeterminate: Story = {
  args: { isIndeterminate: true },
};

export const CustomValueText: Story = {
  args: { value: 2, maxValue: 5, valueLabel: '2 of 5 folders' },
};

export const WithoutLabel: Story = {
  args: { label: undefined, hideValue: true, 'aria-label': 'Progress' },
};
