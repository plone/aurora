import { ColorSwatch } from './ColorSwatch';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/ColorSwatch',
  component: ColorSwatch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    color: '#0b78d0',
  },
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Transparent: Story = {
  args: { color: 'rgba(11, 120, 208, 0.4)' },
};
