import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberField } from './NumberField';

const meta = {
  title: 'Quanta/NumberField',
  component: NumberField,
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
  },
  tags: ['autodocs'],
  args: {
    label: 'Items per page',
  },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    description: 'How many items a listing shows.',
    defaultValue: 10,
    minValue: 1,
  },
};

export const Decimal: Story = {
  args: {
    label: 'Price',
    defaultValue: 9.99,
    step: 0.01,
    formatOptions: { style: 'currency', currency: 'EUR' },
  },
};

export const Errored: Story = {
  args: {
    ...Default.args,
    isInvalid: true,
    errorMessage: 'Enter a number of at least 1.',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    isDisabled: true,
  },
};
