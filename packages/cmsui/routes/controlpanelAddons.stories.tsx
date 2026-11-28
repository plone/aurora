import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { PluggablesProvider } from '@plone/layout/components/Pluggable';
import AddonsControlPanel from './controlpanelAddons';

type LoaderData = {
  siteAddons: any[];
};

const translations = {
  'cmsui.siteSetup': 'Site setup',
  'cmsui.addons.title': 'Add-ons',
  'cmsui.addons.description':
    'Install, upgrade and uninstall the add-ons of this site. Only add-ons that are part of the build show up here.',
  'cmsui.addons.docsLink': 'Add a new add-on',
  'cmsui.addons.installed': 'Installed',
  'cmsui.addons.available': 'Available',
  'cmsui.addons.empty': 'No add-ons found.',
  'cmsui.addons.noMatches': 'No add-ons match your search.',
  'cmsui.addons.install': 'Install',
  'cmsui.addons.uninstall': 'Uninstall',
  'cmsui.addons.upgrade': 'Upgrade',
  'cmsui.addons.upgradeAvailable': 'Upgrade available',
  'cmsui.addons.upgradeFromTo': 'Upgrade {{from}} → {{to}}',
  'cmsui.addons.actions': 'Actions for {{title}}',
  'cmsui.addons.uninstallTitle': 'Uninstall {{title}}?',
  'cmsui.addons.uninstallDescription':
    'Its settings and the content types it adds may be removed from the site.',
  'cmsui.addons.cancel': 'Cancel',
  'cmsui.addons.searchLabel': 'Find an add-on',
  'cmsui.addons.searchPlaceholder': 'Find an add-on',
  'cmsui.addons.actionError': "That didn't work.",
  'cmsui.addons.resultsCount': '{{count}} add-ons found',
} as const;

const formatTranslation = (value: string, options?: Record<string, unknown>) =>
  options
    ? value.replace(/{{(.*?)}}/g, (_, match) => {
        const key = String(match).trim();
        const replacement = options[key];
        return replacement === undefined ? '' : String(replacement);
      })
    : value;

const translate = (key: string, options?: Record<string, unknown>) => {
  const template = translations[key as keyof typeof translations];
  if (!template) return key;
  return formatTranslation(template, options);
};

const storyI18n = {
  language: 'en',
  languages: ['en'],
  isInitialized: true,
  initializedStoreOnce: true,
  options: {
    ns: ['translation'],
    defaultNS: 'translation',
    fallbackLng: 'en',
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
    },
  },
  reportNamespaces: { addUsedNamespaces: () => {} },
  services: { backendConnector: {} },
  store: { on: () => {}, off: () => {} },
  t: translate,
  getFixedT: () => translate,
  hasLoadedNamespace: () => true,
  changeLanguage: async () => 'en',
  loadNamespaces: (_ns: string | string[], callback?: () => void) => {
    callback?.();
    return Promise.resolve();
  },
  loadLanguages: (
    _lng: string,
    _ns: string | string[],
    callback?: () => void,
  ) => {
    callback?.();
    return Promise.resolve();
  },
  on: () => {},
  off: () => {},
  emit: () => {},
} as const satisfies Record<string, unknown>;

const SITE_ADDONS = [
  {
    id: 'collective.easyform',
    title: 'collective.easyform',
    description: 'Build forms through the web.',
    version: '4.1.0',
    is_installed: true,
    upgrade_info: {
      available: true,
      installedVersion: '1000',
      newVersion: '1001',
    },
  },
  {
    id: 'plone.app.mosaic',
    title: 'Plone Mosaic',
    description: 'Layout-based content editing for Plone.',
    version: '4.0.2',
    is_installed: true,
    upgrade_info: { available: false },
  },
  {
    id: 'collective.taxonomy',
    title: 'collective.taxonomy',
    description: 'Manage hierarchical taxonomies.',
    version: '3.1.0',
    is_installed: false,
    upgrade_info: {},
  },
];

const POPULATED: LoaderData = {
  siteAddons: SITE_ADDONS,
};

const ACTION_ERROR = 'Could not install the profile.';

const EMPTY: LoaderData = {
  siteAddons: [],
};

const createAddonsRouter = (data: LoaderData, error?: string) =>
  createMemoryRouter(
    [
      {
        path: '/@@controlpanel/addons',
        loader: () => data,
        action: async () => (error ? { ok: false, error } : { ok: true }),
        element: (
          <I18nextProvider i18n={storyI18n as any}>
            <PluggablesProvider>
              <div className="min-h-screen bg-quanta-air p-8">
                <AddonsControlPanel />
              </div>
            </PluggablesProvider>
          </I18nextProvider>
        ),
      },
      {
        path: '/@@controlpanel',
        element: <div>Control panels</div>,
      },
    ],
    { initialEntries: ['/@@controlpanel/addons'] },
  );

function StoryAddons({ data, error }: { data: LoaderData; error?: string }) {
  const router = useMemo(() => createAddonsRouter(data, error), [data, error]);
  return <RouterProvider router={router} />;
}

const meta = {
  title: 'CMSUI/Routes/AddonsControlPanel',
  component: AddonsControlPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AddonsControlPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <StoryAddons data={POPULATED} />,
};

export const Empty: Story = {
  render: () => <StoryAddons data={EMPTY} />,
};

/** Every action fails: press Install or Upgrade to see the error. */
export const ActionError: Story = {
  render: () => <StoryAddons data={POPULATED} error={ACTION_ERROR} />,
};
