import React from 'react';
import { ToggleButton, ToggleButtonGroup } from './ToggleButton';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/ToggleButtonGroup',
  component: ToggleButtonGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    selectionMode: 'single',
    disallowEmptySelection: true,
    defaultSelectedKeys: ['all'],
    'aria-label': 'Show',
  },
} satisfies Meta<typeof ToggleButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ToggleButtonGroup {...args}>
      <ToggleButton id="all">All 10</ToggleButton>
      <ToggleButton id="custom">Custom 0</ToggleButton>
      <ToggleButton id="not-addable">Not addable 2</ToggleButton>
    </ToggleButtonGroup>
  ),
};

export const Multiple: Story = {
  args: {
    selectionMode: 'multiple',
    disallowEmptySelection: false,
    defaultSelectedKeys: ['link', 'upload'],
  },
  render: Default.render,
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: Default.render,
};

export const SingleToggleButton: Story = {
  render: () => <ToggleButton>Show deprecated</ToggleButton>,
};
