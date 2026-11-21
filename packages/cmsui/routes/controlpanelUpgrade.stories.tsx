import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { PluggablesProvider } from '@plone/layout/components/Pluggable';
import type { GetUpgradeResponse } from '@plone/types';
import UpgradeControlPanel, {
  type UpgradeActionResult,
} from './controlpanelUpgrade';

const translations = {
  'cmsui.siteSetup': 'Site setup',
  'cmsui.siteOverview.upToDate': 'Up to date',
  'cmsui.siteOverview.upgradeAvailable': 'Upgrade available',
  'cmsui.upgrade.title': 'Upgrade Plone site',
  'cmsui.upgrade.description':
    'Run the upgrade steps of the site configuration after updating Plone.',
  'cmsui.upgrade.docsLink': 'Read the upgrade guide',
  'cmsui.upgrade.versions': 'Configuration versions',
  'cmsui.upgrade.upToDate': 'Your site is up to date.',
  'cmsui.upgrade.outdated':
    'The site configuration is outdated and needs to be upgraded.',
  'cmsui.upgrade.instanceVersion': 'Current active configuration',
  'cmsui.upgrade.fsVersion': 'Latest available configuration',
  'cmsui.upgrade.steps': 'Upgrade steps',
  'cmsui.upgrade.stepsDescription':
    'These upgrade steps will run. Some update the catalog or security settings, which can take a long time on large sites.',
  'cmsui.upgrade.backup':
    'Make sure you have a backup of your site before you upgrade it.',
  'cmsui.upgrade.dryRun': 'Dry run',
  'cmsui.upgrade.run': 'Upgrade',
  'cmsui.upgrade.report': 'Upgrade report',
  'cmsui.upgrade.done': 'The upgrade finished. Your site is up to date.',
  'cmsui.upgrade.dryRunDone': 'Dry run finished. No changes were saved.',
  'cmsui.upgrade.error': 'The upgrade failed.',
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

const OUTDATED: GetUpgradeResponse = {
  '@id': 'http://localhost:8080/Plone/@upgrade',
  upgrade_steps: {
    '6205-6206': [
      { id: 'a', title: 'Add the new registry records' },
      { id: 'b', title: 'Reindex the catalog' },
    ],
    '6206-6207': [{ id: 'c', title: 'Update the workflow permissions' }],
  },
  versions: { fs: '6207', instance: '6205' },
};

const UP_TO_DATE: GetUpgradeResponse = {
  '@id': 'http://localhost:8080/Plone/@upgrade',
  upgrade_steps: {},
  versions: { fs: '6207', instance: '6207' },
};

const REPORT = `Starting the migration from version: 6205
Ran upgrade step: Add the new registry records
Ran upgrade step: Reindex the catalog
Ran upgrade step: Update the workflow permissions
End of upgrade path, main migration has finished.`;

const createUpgradeRouter = (
  data: GetUpgradeResponse,
  result: UpgradeActionResult,
) =>
  createMemoryRouter(
    [
      {
        path: '/@@controlpanel/plone-upgrade',
        loader: () => ({ upgrade: data }),
        action: async () => result,
        element: (
          <I18nextProvider i18n={storyI18n as any}>
            <PluggablesProvider>
              <div className="min-h-screen bg-quanta-air p-8">
                <UpgradeControlPanel />
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
    { initialEntries: ['/@@controlpanel/plone-upgrade'] },
  );

function StoryUpgrade({
  data,
  result = { ok: true, dry_run: false, report: REPORT },
}: {
  data: GetUpgradeResponse;
  result?: UpgradeActionResult;
}) {
  const router = useMemo(
    () => createUpgradeRouter(data, result),
    [data, result],
  );
  return <RouterProvider router={router} />;
}

const meta = {
  title: 'CMSUI/Routes/UpgradeControlPanel',
  component: UpgradeControlPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UpgradeControlPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Press Upgrade to see the report. */
export const Outdated: Story = {
  render: () => <StoryUpgrade data={OUTDATED} />,
};

export const UpToDate: Story = {
  render: () => <StoryUpgrade data={UP_TO_DATE} />,
};

/** The upgrade fails: press Upgrade to see the error. */
export const UpgradeError: Story = {
  render: () => (
    <StoryUpgrade
      data={OUTDATED}
      result={{ ok: false, error: 'Upgrade step failed: KeyError' }}
    />
  ),
};
