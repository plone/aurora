import type { Meta, StoryObj } from '@storybook/react-vite';
import SiteOverview from './SiteOverview';

const system = {
  '@id': 'http://localhost:8080/Plone/@system',
  cmf_version: '3.8',
  debug_mode: 'No',
  pil_version: '12.3.0 (Pillow)',
  plone_gs_metadata_version_file_system: '6205',
  plone_gs_metadata_version_installed: '6205',
  plone_restapi_version: '10.0.4',
  plone_version: '6.2.2',
  python_version: '3.13.15 (main, Aug 31 2026, 23:46:42) [GCC 12.2.0]',
  upgrade: false,
  zope_version: '6.2',
};

const meta = {
  title: 'CMSUI/SiteOverview',
  component: SiteOverview,
  args: {
    system,
    site: {
      'plone.site_title': 'Plone site',
      'plone.default_language': 'en',
      'plone.portal_timezone': 'UTC',
      features: { multilingual: false },
    },
    siteUrl: 'https://www.example.com',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SiteOverview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UpgradeAvailable: Story = {
  args: {
    system: {
      ...system,
      plone_gs_metadata_version_installed: '6204',
      upgrade: true,
    },
  },
};
