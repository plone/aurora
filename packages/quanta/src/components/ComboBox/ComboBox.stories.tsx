import React from 'react';
import { ComboBox, ComboBoxItem, type ComboBoxProps } from './ComboBox';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

const types = [
  { id: 'Document', name: 'Page' },
  { id: 'Event', name: 'Event' },
  { id: 'File', name: 'File' },
  { id: 'Image', name: 'Image' },
  { id: 'Link', name: 'Link' },
  { id: 'News Item', name: 'News Item' },
];

type TypeItem = (typeof types)[number];

const meta: Meta<ComboBoxProps<TypeItem>> = {
  title: 'Quanta/ComboBox',
  component: ComboBox,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  args: {
    label: 'Type to copy',
    placeholder: 'Search types',
    items: types,
    children: (type: TypeItem) => <ComboBoxItem>{type.name}</ComboBoxItem>,
    // ComboBox calls it while rendering a default selection, which an
    // implicit action doesn't allow.
    onInputChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: 'Copies fields, behaviors, layout and settings.',
    defaultSelectedKey: 'Event',
  },
};

export const Invalid: Story = {
  args: { isInvalid: true, errorMessage: 'Choose a type to copy.' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};
