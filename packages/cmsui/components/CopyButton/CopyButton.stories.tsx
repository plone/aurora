import type { Meta, StoryObj } from '@storybook/react-vite';
import CopyButton, { type CopyButtonProps } from './CopyButton';
import { useState } from 'react';

const Wrapper = ({ onCopyRequested, label }: CopyButtonProps) => {
  const [text, setText] = useState('');
  return (
    <div>
      <CopyButton
        label={label}
        onCopyRequested={() => {
          const o = onCopyRequested?.() || '';
          setText(o);
          return o;
        }}
      />
      <p>Copied: &apos;{text}&apos;</p>
    </div>
  );
};

const meta = {
  title: 'CMSUI/SiteOverview/CopyButton',
  component: Wrapper,
} satisfies Meta<typeof CopyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: 'Click me!',
  },
};

export const WithCallback: Story = {
  args: {
    onCopyRequested: () => {
      return 'Thanks.';
    },
  },
};

export const WithLabelAndCallback: Story = {
  args: {
    label: 'Click me!',
    onCopyRequested: () => {
      return 'Thanks.';
    },
  },
};
