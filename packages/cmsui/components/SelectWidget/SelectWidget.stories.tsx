import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SelectWidget } from './SelectWidget';

const meta = {
  title: 'CMSUI/Widgets/SelectWidget',
  component: SelectWidget,
  args: {
    name: 'language',
    label: 'Language',
    description: 'The language of the page.',
    value: 'en',
    onChange: () => {},
    choices: [
      ['en', 'English'],
      ['de', 'Deutsch'],
      ['it', 'Italiano'],
    ],
  },
} satisfies Meta<typeof SelectWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function SelectWidgetStory(args: React.ComponentProps<typeof SelectWidget>) {
  const [value, setValue] = useState(args.value ?? null);
  return <SelectWidget {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <SelectWidgetStory {...args} />,
};

export const Required: Story = {
  args: { required: true },
  render: (args) => <SelectWidgetStory {...args} />,
};

export const Invalid: Story = {
  args: {
    value: null,
    required: true,
    invalid: true,
    errorMessage: 'Required input is missing.',
  },
  render: (args) => <SelectWidgetStory {...args} />,
};
