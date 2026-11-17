import React from 'react';
import { CustomRadio, RadioGroup, Radio } from './RadioGroup';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => (
    <RadioGroup {...args}>
      <Radio value="soccer">Soccer</Radio>
      <Radio value="baseball">Baseball</Radio>
      <Radio value="basketball">Basketball</Radio>
    </RadioGroup>
  ),
  args: {
    label: 'Favorite sport',
  },
};

export const Selected: Story = {
  ...Default,
  args: { label: 'Favorite sport', defaultValue: 'baseball' },
};

export const Horizontal: Story = {
  ...Default,
  args: { label: 'Favorite sport', orientation: 'horizontal' },
};

export const WithDescription: Story = {
  ...Default,
  args: {
    label: 'Favorite sport',
    description: 'Pick the one you watch the most.',
  },
};

export const Disabled: Story = {
  ...Default,
  args: { label: 'Favorite sport', defaultValue: 'soccer', isDisabled: true },
};

export const Invalid: Story = {
  ...Default,
  args: {
    label: 'Favorite sport',
    isInvalid: true,
    errorMessage: 'Pick a sport.',
  },
};

export const Custom: Story = {
  render: (args: any) => (
    <RadioGroup {...args}>
      <CustomRadio value="soccer">Soccer</CustomRadio>
      <CustomRadio value="baseball">Baseball</CustomRadio>
      <CustomRadio value="basketball">Basketball</CustomRadio>
    </RadioGroup>
  ),
  args: { label: 'Favorite sport', defaultValue: 'soccer' },
};
