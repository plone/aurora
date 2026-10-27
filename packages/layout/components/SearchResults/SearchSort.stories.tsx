import { SearchSort } from './SearchSort';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Search/SearchSort',
  component: SearchSort,
  tags: ['autodocs'],
  parameters: {
    router: { initialEntries: ['/?SearchableText=plone'] },
  },
} satisfies Meta<typeof SearchSort>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SortedByDate: Story = {
  parameters: {
    router: { initialEntries: ['/?SearchableText=plone&sort=date'] },
  },
};
