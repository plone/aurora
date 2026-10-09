import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlignWidget, SizeWidget, WidthWidget } from './PickerWidgets';

const meta = {
  title: 'CMSUI/Widgets/PickerWidgets',
  component: AlignWidget,
  args: {
    name: 'align',
    label: 'Alignment',
    value: 'center',
    onChange: () => {},
  },
} satisfies Meta<typeof AlignWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function Controlled({
  Widget,
  ...args
}: React.ComponentProps<typeof AlignWidget> & {
  // The three pickers take different `actionsInfoMap` shapes.
  Widget: React.ComponentType<any>;
}) {
  const [value, setValue] = useState(args.value ?? null);
  return <Widget {...args} value={value} onChange={setValue} />;
}

export const Align: Story = {
  render: (args) => <Controlled {...args} Widget={AlignWidget} />,
};

export const Size: Story = {
  args: { name: 'size', label: 'Size', value: 'm' },
  render: (args) => <Controlled {...args} Widget={SizeWidget} />,
};

export const Width: Story = {
  args: { name: 'blockWidth', label: 'Width', value: 'default' },
  render: (args) => <Controlled {...args} Widget={WidthWidget} />,
};

export const SchemaDefault: Story = {
  args: { value: null, defaultValue: 'left' },
  render: (args) => <Controlled {...args} Widget={AlignWidget} />,
};
