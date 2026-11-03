import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateWidget } from './DateWidget';

const meta = {
  title: 'CMSUI/Widgets/DateWidget',
  component: DateWidget,
  args: {
    name: 'birthday',
    label: 'Birthday',
    value: '2026-10-09',
    onChange: () => {},
  },
} satisfies Meta<typeof DateWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function DateWidgetStory(args: React.ComponentProps<typeof DateWidget>) {
  const [value, setValue] = useState(args.value ?? null);
  return <DateWidget {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <DateWidgetStory {...args} />,
};

export const Invalid: Story = {
  args: {
    invalid: true,
    errorMessage: 'Required input is missing.',
  },
  render: (args) => <DateWidgetStory {...args} />,
};
