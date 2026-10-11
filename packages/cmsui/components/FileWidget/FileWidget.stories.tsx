import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileWidget } from './FileWidget';

const meta = {
  title: 'CMSUI/Widgets/FileWidget',
  component: FileWidget,
  args: {
    name: 'file',
    label: 'File',
    description: 'The file to publish.',
    value: null,
    onChange: () => {},
    required: true,
  },
} satisfies Meta<typeof FileWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function FileWidgetStory(args: React.ComponentProps<typeof FileWidget>) {
  const [value, setValue] = useState(args.value ?? null);
  return <FileWidget {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <FileWidgetStory {...args} />,
};

/** A stored file, as the content API sends it. */
export const WithFile: Story = {
  args: {
    value: {
      filename: 'annual-report.pdf',
      'content-type': 'application/pdf',
      size: 254000,
      download: '/annual-report.pdf/@@download/file',
    },
  },
  render: (args) => <FileWidgetStory {...args} />,
};

/** An `Image` field only takes images, and shows a preview. */
export const Image: Story = {
  args: {
    label: 'Image',
    description: '',
    schema: { factory: 'Image' },
  },
  render: (args) => <FileWidgetStory {...args} />,
};

export const Invalid: Story = {
  args: {
    invalid: true,
    errorMessage: 'Required input is missing.',
  },
  render: (args) => <FileWidgetStory {...args} />,
};
