import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextareaWidget } from './TextareaWidget';

const meta = {
  title: 'CMSUI/Widgets/TextareaWidget',
  component: TextareaWidget,
  args: {
    name: 'description',
    label: 'Summary',
    description: 'Used in item listings and search results.',
    value: 'A short summary of the page.',
    onChange: () => {},
  },
} satisfies Meta<typeof TextareaWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function TextareaWidgetStory(
  args: React.ComponentProps<typeof TextareaWidget>,
) {
  const [value, setValue] = useState(args.value ?? '');
  return <TextareaWidget {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <TextareaWidgetStory {...args} />,
};

export const Invalid: Story = {
  args: {
    value: '',
    required: true,
    invalid: true,
    errorMessage: 'Required input is missing.',
  },
  render: (args) => <TextareaWidgetStory {...args} />,
};
