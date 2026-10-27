import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import * as icons from '../icons';

type IconComponent = (typeof icons)[keyof typeof icons];

const iconEntries = Object.entries(icons) as [string, IconComponent][];

const IconGallery = ({ size = 'lg' }: { size?: 'base' | 'lg' | 'xl' }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '8px',
      padding: '16px',
    }}
  >
    {iconEntries.map(([name, IconComponent]) => (
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
);

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
