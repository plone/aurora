import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrayWidget } from './ArrayWidget';

const meta = {
  title: 'CMSUI/Widgets/ArrayWidget',
  component: ArrayWidget,
  args: {
    name: 'subjects',
    label: 'Tags',
    description: 'Tags are commonly used for ad-hoc organization of content.',
    value: ['news', 'events'],
    onChange: () => {},
  },
} satisfies Meta<typeof ArrayWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function ArrayWidgetStory(args: React.ComponentProps<typeof ArrayWidget>) {
  const [value, setValue] = useState(args.value ?? null);
  return <ArrayWidget {...args} value={value} onChange={setValue} />;
}

/** The editor can add any token. */
export const Default: Story = {
  render: (args) => <ArrayWidgetStory {...args} />,
};

/** The schema's `items` restrict the tokens to their choices. */
export const WithChoices: Story = {
  args: {
    label: 'Days',
    description: '',
    value: ['MO'],
    schema: {
      type: 'array',
      items: {
        choices: [
          ['MO', 'Monday'],
          ['TU', 'Tuesday'],
          ['WE', 'Wednesday'],
        ],
      },
    },
  },
  render: (args) => <ArrayWidgetStory {...args} />,
};

export const Invalid: Story = {
  args: {
    value: [],
    required: true,
    invalid: true,
    errorMessage: 'Required input is missing.',
  },
  render: (args) => <ArrayWidgetStory {...args} />,
};
