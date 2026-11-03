import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateTimeWidget } from './DateTimeWidget';

const meta = {
  title: 'CMSUI/Widgets/DateTimeWidget',
  component: DateTimeWidget,
  args: {
    name: 'start',
    label: 'Event starts',
    value: '2026-10-05T10:00:00+00:00',
    onChange: () => {},
  },
} satisfies Meta<typeof DateTimeWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function DateTimeWidgetStory(
  args: React.ComponentProps<typeof DateTimeWidget>,
) {
  const [value, setValue] = useState(args.value ?? null);
  return <DateTimeWidget {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <DateTimeWidgetStory {...args} />,
};

export const Invalid: Story = {
  args: {
    invalid: true,
    errorMessage: 'Event end date must be on or after Oct 5, 2026, 10:00 AM.',
  },
  render: (args) => <DateTimeWidgetStory {...args} />,
};
