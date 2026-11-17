import React, { useState } from 'react';
import { Pagination, type PaginationProps } from './Pagination';
import type { Meta, StoryObj } from '@storybook/react-vite';

function StatefulPagination(props: PaginationProps) {
  const [page, setPage] = useState(props.currentPage ?? 0);
  return <Pagination {...props} currentPage={page} onPageChange={setPage} />;
}

const meta = {
  title: 'Quanta/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    totalPages: 10,
    currentPage: 0,
    onPageChange: () => {},
  },
  render: (args) => <StatefulPagination {...args} />,
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MiddlePage: Story = {
  args: { currentPage: 5 },
};

export const LastPage: Story = {
  args: { currentPage: 9 },
};

export const FewPages: Story = {
  args: { totalPages: 4, currentPage: 1 },
};
