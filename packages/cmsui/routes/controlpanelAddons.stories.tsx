import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { PluggablesProvider } from '@plone/layout/components/Pluggable';
import AddonsControlPanel from './controlpanelAddons';

type LoaderData = {
  siteAddons: any[];
  query: string;
  catalog: any[];
  catalogTotal: number;
  catalogStart: number;
  catalogSize: number;
};

const translations = {
  'cmsui.paneltitles.addons': 'Add-ons',
  'cmsui.addons.installed': 'Installed',
  'cmsui.addons.available': 'Available',
  'cmsui.addons.empty': 'No add-ons found.',
  'cmsui.addons.noMatches': 'No add-ons match your search.',
  'cmsui.addons.version': 'Version {{version}}',
  'cmsui.addons.latestVersion': 'Latest version: {{version}}',
  'cmsui.addons.install': 'Install',
  'cmsui.addons.uninstall': 'Uninstall',
  'cmsui.addons.upgrade': 'Upgrade',
  'cmsui.addons.details': 'Details',
  'cmsui.addons.catalog': 'Catalog',
  'cmsui.addons.prev': 'Previous',
  'cmsui.addons.next': 'Next',
  'cmsui.addons.page': '{{current}} / {{total}}',
  'cmsui.addons.searchPlaceholder': 'Filter add-ons…',
  'cmsui.addons.pairsWith': 'Pairs with',
  'cmsui.addons.opensInNewTab': '(opens in a new tab)',
  'cmsui.addons.resultsCount': '{{total}} add-ons found',
  'cmsui.addons.actionError': 'Action failed. Please try again.',
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
    upgrade_info: { available: true },
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

const CATALOG = [
  {
    id: 'pypi:collective.volto.formsupport',
    name: 'collective.volto.formsupport',
    title: 'Volto Form Support',
    summary: 'Backend support for Volto forms.',
    kind: 'backend',
    source: 'pypi',
    latest_version: '5.0.0',
    trust: 'community',
    status: 'available',
    repo_url: 'https://github.com/collective/collective.volto.formsupport',
    homepage: 'https://github.com/collective/collective.volto.formsupport',
    pairs_with: ['npm:@kitconcept/volto-form-block'],
  },
  {
    id: 'pypi:eea.facetednavigation',
    name: 'eea.facetednavigation',
    title: 'EEA Faceted Navigation',
    summary: 'Faceted search and navigation for Plone.',
    kind: 'backend',
    source: 'pypi',
    latest_version: '20.0',
    trust: 'community',
    status: 'available',
    repo_url: 'https://github.com/eea/eea.facetednavigation',
    homepage: 'https://github.com/eea/eea.facetednavigation',
    pairs_with: [],
  },
];

const POPULATED: LoaderData = {
  siteAddons: SITE_ADDONS,
  query: '',
  catalog: CATALOG,
  catalogTotal: CATALOG.length,
  catalogStart: 0,
  catalogSize: 24,
};

const EMPTY: LoaderData = {
  siteAddons: [],
  query: '',
  catalog: [],
  catalogTotal: 0,
  catalogStart: 0,
  catalogSize: 24,
};

const createAddonsRouter = (data: LoaderData) =>
  createMemoryRouter(
    [
      {
        path: '/controlpanel/addons',
        loader: () => data,
        action: async () => ({ ok: true }),
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
        path: '/controlpanel',
        element: <div>Control panels</div>,
      },
    ],
    { initialEntries: ['/controlpanel/addons'] },
  );

function StoryAddons({ data }: { data: LoaderData }) {
  const router = useMemo(() => createAddonsRouter(data), [data]);
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
