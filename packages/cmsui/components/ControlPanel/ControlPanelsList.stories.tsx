import type { Meta, StoryObj } from '@storybook/react-vite';
import config from '@plone/registry';
import installComponents from '@plone/layout/config/components';
import installControlpanels from '../../config/controlpanels';
import { ControlPanelsList } from './ControlPanelsList';

installComponents(config);
installControlpanels(config);

const panel = (id: string, title: string, group: string) => ({
  '@id': `http://localhost:8080/Plone/@controlpanels/${id}`,
  title,
  group,
});

const meta = {
  title: 'CMSUI/ControlPanelsList',
  component: ControlPanelsList,
  args: {
    controlpanels: [
      panel('date-and-time', 'Date and Time', 'General'),
      panel('language', 'Language', 'General'),
      panel('mail', 'Mail', 'General'),
      panel('navigation', 'Navigation', 'General'),
      panel('search', 'Search', 'General'),
      panel('site', 'Site', 'General'),
      panel('socialmedia', 'Social Media', 'General'),
      panel('volto-settings', 'Volto Settings', 'General'),
      panel('dexterity-types', 'Content Types', 'Content'),
      panel('discussion', 'Discussion', 'Content'),
      panel('editing', 'Editing', 'Content'),
      panel('imaging', 'Image Handling', 'Content'),
      panel('usergroup', 'User and Group Settings', 'Users'),
      panel('security', 'Security', 'Security'),
      panel('my-addon', 'An add-on without an icon', 'Add-ons'),
    ],
  },
} satisfies Meta<typeof ControlPanelsList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
