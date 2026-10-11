import { Switch } from './Switch';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Quanta/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: 'Globally addable',
    isDisabled: false,
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { defaultSelected: true },
};

export const WithDescription: Story = {
  args: {
    description:
      "Editors can add events in any folder that doesn't restrict its contents.",
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultSelected: true },
};

export const WithoutVisibleLabel: Story = {
  args: { children: undefined, 'aria-label': 'Globally addable' },
};
