import React from 'react';
import {
  ComboBox,
  ComboBoxItem,
  ComboBoxSection,
  type ComboBoxProps,
} from './ComboBox';
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

export const Sections: Story = {
  args: {
    items: undefined,
    children: (
      <>
        <ComboBoxSection id="content" title="Content">
          <ComboBoxItem id="Document">Page</ComboBoxItem>
          <ComboBoxItem id="News Item">News Item</ComboBoxItem>
        </ComboBoxSection>
        <ComboBoxSection id="media" title="Media">
          <ComboBoxItem id="Image">Image</ComboBoxItem>
          <ComboBoxItem id="File">File</ComboBoxItem>
        </ComboBoxSection>
      </>
    ),
  },
};

export const MultipleSelection: Story = {
  render: (args) => (
    <ComboBox<TypeItem, 'multiple'>
      label={args.label}
      placeholder={args.placeholder}
      items={types}
      selectionMode="multiple"
      defaultValue={['Document', 'Event']}
    >
      {(type) => <ComboBoxItem>{type.name}</ComboBoxItem>}
    </ComboBox>
  ),
};
