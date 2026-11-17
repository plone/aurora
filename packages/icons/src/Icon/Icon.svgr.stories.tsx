import React from 'react';
import IconSGVR from '../svg/add.svg?react';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'IconSVGR',
  component: IconSGVR,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      options: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
      control: { type: 'radio' },
    },
    color: {
      control: { type: 'color' },
    },
  },
} satisfies Meta<typeof IconSGVR>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => <IconSGVR {...args} />,
  args: {
    size: 'lg',
  },
};
