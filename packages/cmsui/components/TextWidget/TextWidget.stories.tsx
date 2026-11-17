import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextWidget } from './TextWidget';

const meta = {
  title: 'CMSUI/Widgets/TextWidget',
  component: TextWidget,
  args: {
    name: 'title',
    label: 'Title',
    description: 'The title of the page.',
    value: 'My page',
    onChange: () => {},
    required: true,
  },
} satisfies Meta<typeof TextWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function TextWidgetStory(args: React.ComponentProps<typeof TextWidget>) {
  const [value, setValue] = useState(args.value ?? '');
  return <TextWidget {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <TextWidgetStory {...args} />,
};

export const Invalid: Story = {
  args: {
    value: '',
    invalid: true,
    errorMessage: 'Required input is missing.',
  },
  render: (args) => <TextWidgetStory {...args} />,
};
