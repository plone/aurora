import { Pagination } from './Pagination';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Basic/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  args: {
    totalPages: 12,
    currentPage: 5,
    onPageChange: () => {},
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLinks: Story = {
  args: {
    onPageChange: undefined,
    getPageHref: (page: number) => `?b_start=${page * 25}`,
  },
};

export const WithPrevNextLabels: Story = {
  args: {
    getPageHref: (page: number) => `?b_start=${page * 25}`,
    prevLabel: 'Previous',
    nextLabel: 'Next',
    showPrevNextLabels: true,
  },
};
