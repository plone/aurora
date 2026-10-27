import { SearchPagination } from './SearchPagination';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Search/SearchPagination',
  component: SearchPagination,
  tags: ['autodocs'],
  args: { total: 240, bStart: 0, bSize: 25 },
  parameters: {
    router: { initialEntries: ['/?SearchableText=plone'] },
  },
} satisfies Meta<typeof SearchPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {};

export const MiddlePage: Story = {
  args: { bStart: 125 },
};

export const LastPage: Story = {
  args: { bStart: 225 },
};
