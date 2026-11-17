import { useState } from 'react';
import {
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button as AriaButton } from 'react-aria-components';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import {
  Button,
  Container,
  Heading,
  Link,
  Menu,
  MenuItem,
  MenuTrigger,
  ModalSheet,
  SearchField,
} from '@plone/quanta';
import { Plug } from '@plone/layout/components/Pluggable';
import type { Addons } from '@plone/types';
import Back from '@plone/icons/svg/arrow-left.svg?react';
import AddonIcon from '@plone/icons/svg/archive.svg?react';
import MoreOptions from '@plone/icons/svg/more-options.svg?react';

type SiteAddon = Addons['items'][number];

type UpgradeInfo = {
  available?: boolean;
  installedVersion?: string;
  newVersion?: string;
};

const upgradeInfo = (addon: SiteAddon): UpgradeInfo =>
  (addon.upgrade_info as UpgradeInfo | undefined) ?? {};

const isUpgradable = (addon: SiteAddon) =>
  Boolean(upgradeInfo(addon).available);

const byTitle = (a: SiteAddon, b: SiteAddon) =>
  (a.title || a.id).localeCompare(b.title || b.id, undefined, {
    sensitivity: 'base',
  });

// The ones with an upgrade first, then by title.
const byUpgradeThenTitle = (a: SiteAddon, b: SiteAddon) =>
  Number(isUpgradable(b)) - Number(isUpgradable(a)) || byTitle(a, b);

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const addonsRes = await cli.getAddons();

  return { siteAddons: addonsRes.data.items };
}

type ActionResult = { ok: true } | { ok: false; error: string };

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>): Promise<ActionResult> {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const formData = await request.formData();
  const id = String(formData.get('id'));
  const intent = String(formData.get('intent'));

  try {
    switch (intent) {
      case 'install':
        await cli.installAddon({ id });
        break;
      case 'uninstall':
        await cli.uninstallAddon({ id });
        break;
      case 'upgrade':
        await cli.upgradeAddon({ id });
        break;
      default:
        return { ok: false, error: `Unknown intent: ${intent}` };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return { ok: true };
}

/** The pill of an add-on with an upgrade, with the versions when they differ. */
function UpgradePill({ addon }: { addon: SiteAddon }) {
  const { t } = useTranslation();
  const { installedVersion, newVersion } = upgradeInfo(addon);
  return (
    <span
      className={`
        rounded-full bg-quanta-cream px-2 py-0.5 text-xs font-semibold whitespace-nowrap
        text-quanta-bronze
      `}
    >
      {installedVersion && newVersion && installedVersion !== newVersion
        ? t('cmsui.addons.upgradeFromTo', {
            from: installedVersion,
            to: newVersion,
          })
        : t('cmsui.addons.upgradeAvailable')}
    </span>
  );
}

/** Asks before an add-on is uninstalled. */
function UninstallDialog({
  title,
  isOpen,
  onConfirm,
  onCancel,
}: {
  title: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ModalSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      className="[--modal-max-width:400px]"
    >
      <Heading slot="title" className="mb-2 text-xl font-bold">
        {t('cmsui.addons.uninstallTitle', { title })}
      </Heading>
      <p className="text-sm text-quanta-iron">
        {t('cmsui.addons.uninstallDescription')}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="neutral" onPress={onCancel}>
          {t('cmsui.addons.cancel')}
        </Button>
        <Button variant="destructive" accent onPress={onConfirm}>
          {t('cmsui.addons.uninstall')}
        </Button>
      </div>
    </ModalSheet>
  );
}

/** One add-on: what it is, and what can be done with it. */
function AddonRow({ addon }: { addon: SiteAddon }) {
  const { t } = useTranslation();
  const fetcher = useFetcher<typeof action>();
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const busy = fetcher.state !== 'idle';
  const title = addon.title || addon.id;
  const upgradable = addon.is_installed && isUpgradable(addon);
  const domId = `addon-${addon.id.replace(/[^\w-]/g, '-')}`;

  const submit = (intent: 'install' | 'uninstall' | 'upgrade') =>
    fetcher.submit({ id: addon.id, intent }, { method: 'post' });

  return (
    <li className="addon-item flex flex-col gap-2 bg-quanta-air px-4 py-3">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className={`
            flex size-9 shrink-0 items-center justify-center rounded-lg
            ${
              addon.is_installed
                ? 'bg-quanta-arctic text-quanta-royal'
                : 'bg-quanta-snow text-quanta-pigeon'
            }
          `}
        >
          <AddonIcon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              id={`${domId}-title`}
              className="text-[15px] leading-[22px] font-semibold text-quanta-denim"
            >
              {title}
            </h3>
            {upgradable && <UpgradePill addon={addon} />}
          </div>
          {addon.description && (
            <p className="text-[13px] leading-[18px] text-quanta-pigeon">
              {addon.description}
            </p>
          )}
          <p className="font-mono text-xs leading-[18px] break-words text-quanta-dolphin">
            {addon.version ? `${addon.id} · ${addon.version}` : addon.id}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!addon.is_installed && (
            <Button
              size="S"
              variant="neutral"
              accent
              aria-describedby={`${domId}-title`}
              isPending={busy}
              onPress={() => submit('install')}
            >
              {t('cmsui.addons.install')}
            </Button>
          )}
          {upgradable && (
            <Button
              size="S"
              variant="primary"
              accent
              aria-describedby={`${domId}-title`}
              isPending={busy}
              onPress={() => submit('upgrade')}
            >
              {t('cmsui.addons.upgrade')}
            </Button>
          )}
          {addon.is_installed && (
            <MenuTrigger placement="bottom end">
              <AriaButton
                aria-label={t('cmsui.addons.actions', { title })}
                isDisabled={busy}
                className={`
                  flex size-8 cursor-pointer items-center justify-center rounded-md border-0
                  bg-transparent p-0 text-quanta-pigeon
                  hover:bg-quanta-snow hover:text-quanta-space
                  focus-visible:outline-2 focus-visible:outline-quanta-cobalt
                  disabled:cursor-not-allowed disabled:opacity-40
                `}
              >
                <MoreOptions className="size-5" />
              </AriaButton>
              {/* A menu acts on pointer up, so the dialog opens after the
                click that follows, which would otherwise close it as a
                click outside. */}
              <Menu
                onAction={() => setTimeout(() => setConfirmUninstall(true))}
              >
                <MenuItem id="uninstall" className="text-quanta-candy">
                  {t('cmsui.addons.uninstall')}
                </MenuItem>
              </Menu>
            </MenuTrigger>
          )}
        </div>
      </div>
      {fetcher.data && !fetcher.data.ok && (
        <p role="alert" className="text-[13px] text-quanta-candy">
          {t('cmsui.addons.actionError')}{' '}
          <span className="text-quanta-iron">{fetcher.data.error}</span>
        </p>
      )}
      <UninstallDialog
        title={title}
        isOpen={confirmUninstall}
        onCancel={() => setConfirmUninstall(false)}
        onConfirm={() => {
          setConfirmUninstall(false);
          submit('uninstall');
        }}
      />
    </li>
  );
}

function AddonGroup({
  id,
  title,
  addons,
}: {
  id: string;
  title: string;
  addons: SiteAddon[];
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className={`
          mb-2.5 flex items-center gap-2 text-[13px] leading-5 font-semibold tracking-wide
          text-quanta-iron uppercase
        `}
      >
        {title}
        <span className="font-normal text-quanta-dolphin">{addons.length}</span>
      </h2>
      <ul
        className={`
          flex flex-col gap-px overflow-hidden rounded-[10px] border border-quanta-smoke
          bg-quanta-smoke
        `}
      >
        {addons.map((addon) => (
          <AddonRow key={addon.id} addon={addon} />
        ))}
      </ul>
    </section>
  );
}

export default function AddonsControlPanel() {
  const { siteAddons } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const search = query.trim().toLocaleLowerCase();
  const matches = (addon: SiteAddon) =>
    `${addon.title} ${addon.id} ${addon.description}`
      .toLocaleLowerCase()
      .includes(search);

  const shown = siteAddons.filter(matches);
  const installed = shown
    .filter((addon) => addon.is_installed)
    .sort(byUpgradeThenTitle);
  const available = shown.filter((addon) => !addon.is_installed).sort(byTitle);

  return (
    <main className="route-addons">
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href="/controlpanel">
          <Back />
        </Link>
      </Plug>
      <Container
        width="default"
        className={`
          route-controlpanel px-4 pt-6 pb-16
          md:px-12 md:pt-12
        `}
      >
        <header className="mb-8 flex flex-col gap-1">
          <Link
            href="/controlpanel"
            className={`
              self-start text-[13px] font-medium text-quanta-sapphire no-underline
              hover:text-quanta-royal
            `}
          >
            {t('cmsui.siteSetup')}
          </Link>
          <h1
            className={`documentFirstHeading text-[28px] leading-[34px] font-bold text-quanta-denim`}
          >
            {t('cmsui.addons.title')}
          </h1>
          <p className="text-sm text-quanta-iron">
            {t('cmsui.addons.description')}{' '}
            <a
              href="https://6.docs.plone.org/admin-guide/add-ons.html"
              target="_blank"
              rel="noreferrer"
              className="text-quanta-sapphire underline"
            >
              {t('cmsui.addons.docsLink')}
            </a>
          </p>
        </header>

        <div className="flex flex-col gap-7">
          <SearchField
            aria-label={t('cmsui.addons.searchLabel')}
            placeholder={t('cmsui.addons.searchPlaceholder')}
            value={query}
            onChange={setQuery}
            className="max-w-[560px]"
          />

          <p role="status" aria-live="polite" className="sr-only">
            {t('cmsui.addons.resultsCount', { count: shown.length })}
          </p>

          {shown.length === 0 ? (
            <p className="text-sm text-quanta-iron">
              {search ? t('cmsui.addons.noMatches') : t('cmsui.addons.empty')}
            </p>
          ) : (
            <>
              {installed.length > 0 && (
                <AddonGroup
                  id="addons-installed"
                  title={t('cmsui.addons.installed')}
                  addons={installed}
                />
              )}
              {available.length > 0 && (
                <AddonGroup
                  id="addons-available"
                  title={t('cmsui.addons.available')}
                  addons={available}
                />
              )}
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
