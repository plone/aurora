import React from 'react';
import { ColorSwatchPicker, ColorSwatchPickerItem } from './ColorSwatchPicker';
import type { Meta, StoryObj } from '@storybook/react-vite';

const colors = [
  '#021322',
  '#617789',
  '#0b78d0',
  '#c1121f',
  '#1c8d3a',
  '#f5b700',
];

const meta = {
  title: 'Quanta/ColorSwatchPicker',
  component: ColorSwatchPicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    'aria-label': 'Background color',
    defaultValue: '#0b78d0',
  },
  render: (args) => (
    <ColorSwatchPicker {...args}>
      {colors.map((color) => (
        <ColorSwatchPickerItem key={color} color={color} />
      ))}
    </ColorSwatchPicker>
  ),
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Wrapped: Story = {
  decorators: [
    (Story) => (
      <div className="w-36">
        <Story />
      </div>
    ),
  ],
};
