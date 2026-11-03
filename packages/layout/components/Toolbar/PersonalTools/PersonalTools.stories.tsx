import type { Meta, StoryObj } from '@storybook/react-vite';
import { PersonalTools } from './PersonalTools';

const meta = {
  title: 'Layout/Toolbar/PersonalTools',
  component: PersonalTools,
  args: {
    user: {
      fullname: 'Jane Smith',
      username: 'jane',
      email: 'jane@example.com',
    },
    actions: { user: [{ id: 'plone_setup' }] },
  },
} satisfies Meta<typeof PersonalTools>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const BackendActions: Story = {
  args: {
    actions: {
      personal_tools: [
        { id: 'account', title: 'Account', url: '/account' },
        { id: 'dashboard', title: 'My dashboard', url: '/dashboard' },
      ],
    },
  },
};
