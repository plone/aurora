import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './Separator';

const meta = {
  title: 'Quanta/Separator',
  component: Separator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="flex w-64 flex-col gap-2">
      <span>Above</span>
      <Separator {...args} />
      <span>Below</span>
    </div>
  ),
};

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-8 items-center gap-2">
      <span>Left</span>
      <Separator {...args} orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
