import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreMenu } from './MoreMenu';

const meta = {
  title: 'Layout/Toolbar/MoreMenu',
  component: MoreMenu,
  args: {
    content: {
      title: 'News',
      '@type': 'Folder',
      layout: 'listing_view',
      modified: '2026-10-27T12:00:00Z',
    },
    path: '/news',
    actions: {
      object: [
        { id: 'history', title: 'History', url: '/news/@@historyview' },
        { id: 'local_roles', title: 'Sharing', url: '/news/@@sharing' },
      ],
    },
    workflow: {
      state: { id: 'published', title: 'Published' },
      transitions: [{ '@id': '/news/@workflow/retract', title: 'Retract' }],
    },
    layouts: ['listing_view', 'summary_view'],
    onChange: () => {},
  },
} satisfies Meta<typeof MoreMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const BackendActions: Story = {
  args: {
    actions: {
      more_menu: [{ id: 'custom', title: 'Custom action', url: '/custom' }],
    },
  },
};
