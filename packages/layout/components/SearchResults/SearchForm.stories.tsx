import { SearchForm } from './SearchForm';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Search/SearchForm',
  component: SearchForm,
  tags: ['autodocs'],
  parameters: {
    router: { initialEntries: ['/?SearchableText=plone'] },
  },
} satisfies Meta<typeof SearchForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    router: { initialEntries: ['/'] },
  },
};
