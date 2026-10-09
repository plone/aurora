import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberWidget } from './NumberWidget';

const meta = {
  title: 'CMSUI/Widgets/NumberWidget',
  component: NumberWidget,
  args: {
    name: 'limit',
    label: 'Items per page',
    description: 'How many items a listing shows.',
    value: 10,
    onChange: () => {},
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  },
} satisfies Meta<typeof NumberWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function NumberWidgetStory(args: React.ComponentProps<typeof NumberWidget>) {
  const [value, setValue] = useState(args.value ?? null);
  return <NumberWidget {...args} value={value} onChange={setValue} />;
}

/** An `integer` field, between its `minimum` and `maximum`. */
export const Default: Story = {
  render: (args) => <NumberWidgetStory {...args} />,
};

/** A `number` field takes decimals. */
export const Decimal: Story = {
  args: {
    label: 'Ratio',
    description: '',
    value: 1.5,
    schema: { type: 'number' },
  },
  render: (args) => <NumberWidgetStory {...args} />,
};

export const Invalid: Story = {
  args: {
    value: null,
    required: true,
    invalid: true,
    errorMessage: 'Required input is missing.',
  },
  render: (args) => <NumberWidgetStory {...args} />,
};
