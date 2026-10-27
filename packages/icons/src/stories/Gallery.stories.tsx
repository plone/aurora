import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import * as icons from '../icons';

type IconComponent = (typeof icons)[keyof typeof icons];

const iconEntries = Object.entries(icons) as [string, IconComponent][];

const matchesQuery = (name: string, query: string) =>
  name.replace(/Icon$/, '').toLowerCase().includes(query);

const IconGallery = ({ size = 'lg' }: { size?: 'base' | 'lg' | 'xl' }) => {
  const [search, setSearch] = React.useState('');
  const query = search.trim().toLowerCase();
  const filtered = query
    ? iconEntries.filter(([name]) => matchesQuery(name, query))
    : iconEntries;

  return (
    <div style={{ padding: '16px' }}>
      <input
        type="search"
        aria-label="Search icons"
        placeholder="Search icons…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{
          width: '100%',
          maxWidth: '320px',
          padding: '8px 12px',
          fontSize: '14px',
          boxSizing: 'border-box',
        }}
      />
      <p style={{ margin: '8px 0', fontSize: '13px' }}>
        {filtered.length} of {iconEntries.length} icons
      </p>
      {filtered.length === 0 ? (
        <p style={{ fontSize: '13px' }}>No icons match “{search.trim()}”.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '8px',
          }}
        >
          {filtered.map(([name, IconComponent]) => (
            <figure
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
                padding: '16px 4px',
                fontSize: '13px',
              }}
            >
              <IconComponent size={size} />
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
};

const meta = {
  title: 'Gallery',
  component: IconGallery,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    size: {
      options: ['base', 'lg', 'xl'],
      control: { type: 'radio' },
    },
  },
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { size: 'lg' },
};
