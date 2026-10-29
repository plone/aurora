import DocumentTitle from './DocumentTitle';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Basic/DocumentTitle',
  component: DocumentTitle,
  tags: ['autodocs'],
} satisfies Meta<typeof DocumentTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Search results',
  },
};
