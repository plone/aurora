import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmailWidget, PasswordWidget, UrlWidget } from './InputWidgets';

const meta = {
  title: 'CMSUI/Widgets/InputWidgets',
  component: EmailWidget,
  args: {
    name: 'field',
    label: 'Field',
    value: '',
    onChange: () => {},
  },
} satisfies Meta<typeof EmailWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

function InputWidgetStory({
  Widget,
  ...args
}: React.ComponentProps<typeof EmailWidget> & {
  Widget: typeof EmailWidget;
}) {
  const [value, setValue] = useState(args.value ?? '');
  return <Widget {...args} value={value} onChange={setValue} />;
}

export const Email: Story = {
  args: { label: 'Email', value: 'editor@example.com' },
  render: (args) => <InputWidgetStory {...args} Widget={EmailWidget} />,
};

export const Password: Story = {
  args: { label: 'Password', value: 'secret' },
  render: (args) => <InputWidgetStory {...args} Widget={PasswordWidget} />,
};

export const Url: Story = {
  args: { label: 'URL', value: 'https://plone.org' },
  render: (args) => <InputWidgetStory {...args} Widget={UrlWidget} />,
};
