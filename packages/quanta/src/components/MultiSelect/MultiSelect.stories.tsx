import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiSelect, type MultiSelectItem } from './MultiSelect';

const fruits: MultiSelectItem[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'banana', name: 'Banana' },
  { id: 'cherry', name: 'Cherry' },
  { id: 'kiwi', name: 'Kiwi' },
  { id: 'mango', name: 'Mango' },
  { id: 'orange', name: 'Orange' },
];

const meta = {
  title: 'Quanta/MultiSelect',
  component: MultiSelect,
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
    label: 'Fruits',
    placeholder: 'Type to add a fruit',
    items: fruits,
    value: [],
    onChange: () => {},
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(args: React.ComponentProps<typeof MultiSelect>) {
  const [value, setValue] = useState(args.value);
  return <MultiSelect {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    value: [fruits[0], fruits[4]],
  },
};

export const Creatable: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    description: 'Type a fruit that is not in the list, and press Enter.',
    allowsCustomValue: true,
    value: [fruits[1], { id: 'papaya', name: 'papaya' }],
  },
};

export const Disabled: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    value: [fruits[0], fruits[2]],
    isDisabled: true,
  },
};

export const Invalid: Story = {
  render: (args) => <Controlled {...args} />,
  args: {
    isRequired: true,
    isInvalid: true,
    errorMessage: 'Pick at least one fruit.',
  },
};
