import { SearchResults } from './SearchResults';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Brain } from '@plone/types';

const items = [
  {
    '@id': '/news/plone-aurora-released',
    '@type': 'News Item',
    type_title: 'News Item',
    title: 'Plone Aurora released',
    description: 'The new API-first frontend for Plone is available.',
    effective: '2026-09-15T10:00:00+00:00',
  },
  {
    '@id': '/about',
    '@type': 'Document',
    type_title: 'Page',
    title: 'About us',
    description: 'Who we are and what we do.',
    effective: '2025-03-02T08:30:00+00:00',
  },
  {
    '@id': '/events',
    '@type': 'Folder',
    type_title: 'Folder',
    title: 'Events',
    description: '',
    effective: '1969-12-31T00:00:00+00:00',
  },
] as unknown as Brain[];

const meta = {
  title: 'Search/SearchResults',
  component: SearchResults,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '720px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items, total: items.length, query: 'plone' },
};

export const ManyPages: Story = {
  args: { items, total: 120, bStart: 25, query: 'plone' },
};

export const Loading: Story = {
  args: { items, total: items.length, query: 'plone', loading: true },
};

export const NoResults: Story = {
  args: { items: [], total: 0, query: 'zzz' },
};
