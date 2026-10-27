import { SearchFacets } from './SearchFacets';

import type { Meta, StoryObj } from '@storybook/react-vite';

const facets = [
  { subject: 'news', count: 12 },
  { subject: 'events', count: 7 },
  { subject: 'community', count: 3 },
];

const meta = {
  title: 'Search/SearchFacets',
  component: SearchFacets,
  tags: ['autodocs'],
  args: { facets },
  parameters: {
    router: { initialEntries: ['/?SearchableText=plone'] },
  },
} satisfies Meta<typeof SearchFacets>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActiveFilter: Story = {
  parameters: {
    router: {
      initialEntries: ['/?SearchableText=plone&Subject=events'],
    },
  },
};
