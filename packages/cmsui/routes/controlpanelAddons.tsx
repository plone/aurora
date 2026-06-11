import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useDebounceCallback } from 'usehooks-ts';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import { Button, Container } from '@plone/components/quanta';
import { Plug } from '@plone/layout/components/Pluggable';
import type { Addons } from '@plone/types';
import Back from '@plone/components/icons/arrow-left.svg?react';
import ChevronDown from '@plone/components/icons/chevron-down.svg?react';

type SiteAddon = Addons['items'][number];

const optionalString = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

const CatalogAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  summary: optionalString,
  kind: z.enum(['backend', 'frontend', 'bundle']).catch('backend'),
  source: z.string().catch(''),
  latest_version: optionalString,
  trust: optionalString,
  status: z
    .enum(['installed', 'available', 'not_present', 'frontend'])
    .catch('not_present'),
  repo_url: optionalString,
  homepage: optionalString,
  pairs_with: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? undefined),
});

const MarketplaceResponseSchema = z.object({
  query: z.string(),
  kind: z.string().nullable(),
  plone_version: z.string(),
  volto_version: z.string().nullable(),
  compatible: z.boolean(),
  total: z.number(),
  b_start: z.number(),
  b_size: z.number(),
  count: z.number(),
  results: z.array(CatalogAddonSchema),
});

type CatalogAddon = z.infer<typeof CatalogAddonSchema>;
type MarketplaceResponse = z.infer<typeof MarketplaceResponseSchema>;

type Tone = 'installed' | 'muted';

type ItemView = {
  title: string;
  name: string;
  kind?: string;
  description?: string;
  version?: string;
  pairsWith?: string[];
  upgrade?: { from?: string; to?: string };
};

type UpgradeInfo = {
  available?: boolean;
  installedVersion?: string;
  newVersion?: string;
};

const upgradeInfo = (addon: SiteAddon): UpgradeInfo =>
  (addon.upgrade_info as UpgradeInfo | undefined) ?? {};

const isUpgradable = (addon: SiteAddon) =>
  Boolean(upgradeInfo(addon).available);

const partnerLabel = (id: string) => id.replace(/^(pypi|npm):/, '');

const BATCH_SIZE = 6;
const CATALOG_PAGE_SIZE = 24;

/**
 * Long, reused Tailwind class lists, extracted for readability. Kept as plain
 * strings (names deliberately do not match better-tailwindcss' linted variable
 * patterns) so the class order/content stays exactly as authored.
 */
const styles = {
  catalogDetailsLink:
    'inline-flex w-28 items-center justify-center rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted',
  countBadgeInstalled:
    'rounded-full bg-quanta-daiquiri px-2 py-0.5 text-xs font-semibold text-quanta-emerald',
  countBadgeMuted:
    'rounded-full bg-quanta-smoke px-2 py-0.5 text-xs font-semibold text-quanta-iron',
  sectionSummary:
    'mb-1 flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden',
  addonSummary:
    'flex cursor-pointer list-none items-center gap-3 py-4 [&::-webkit-details-marker]:hidden',
  sectionChevron:
    'ms-auto size-5 shrink-0 rotate-180 text-muted-foreground transition-transform group-open/section:rotate-0',
  addonChevron:
    'size-5 shrink-0 rotate-180 text-muted-foreground transition-transform group-open:rotate-0',
  kindBadge:
    'rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase',
  searchInput:
    'addons-search w-full max-w-md border border-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none',
} as const;
const SEARCH_DEBOUNCE_MS = 300;

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const base = cli.config.apiPath.replace(/\/$/, '');

  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const bStart = Math.max(
    0,
    Number.parseInt(url.searchParams.get('b_start') ?? '0', 10) || 0,
  );

  const empty: MarketplaceResponse = {
    query,
    kind: null,
    plone_version: '',
    volto_version: null,
    compatible: false,
    total: 0,
    b_start: 0,
    b_size: CATALOG_PAGE_SIZE,
    count: 0,
    results: [],
  };

  const loadCatalog = async (): Promise<MarketplaceResponse> => {
    try {
      const params = new URLSearchParams({
        b_start: String(bStart),
        b_size: String(CATALOG_PAGE_SIZE),
      });
      if (query) {
        params.set('q', query);
      }
      // Compatibility filtering was removed; always request the full catalog.
      params.set('compatible', '0');
      const response = await fetch(
        `${base}/@addon-marketplace-search?${params.toString()}`,
        {
          headers: {
            Accept: 'application/json',
            ...(cli.config.token
              ? { Authorization: `Bearer ${cli.config.token}` }
              : {}),
          },
        },
      );
      if (!response.ok) {
        return empty;
      }
      const parsed = MarketplaceResponseSchema.safeParse(await response.json());
      return parsed.success ? parsed.data : empty;
    } catch {
      return empty;
    }
  };

  const [addonsRes, catalog] = await Promise.all([
    cli.getAddons(),
    loadCatalog(),
  ]);

  return {
    siteAddons: addonsRes.data.items,
    query,
    catalog: catalog.results,
    catalogTotal: catalog.total,
    catalogStart: catalog.b_start,
    catalogSize: catalog.b_size,
  };
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

function SiteAddonActions({ addon }: { addon: SiteAddon }) {
  const { t } = useTranslation();
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== 'idle';
  const hasUpgrade = isUpgradable(addon);

  const submit = (intent: string) =>
    fetcher.submit({ id: addon.id, intent }, { method: 'post' });

  const error =
    fetcher.data && !fetcher.data.ok ? (
      <p
        role="alert"
        title={fetcher.data.error}
        className="w-full text-center text-xs text-destructive"
      >
        {t('cmsui.addons.actionError')}
      </p>
    ) : null;

  if (addon.is_installed) {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {hasUpgrade ? (
          <Button
            className="w-28"
            size="S"
            variant="primary"
            isDisabled={busy}
            onPress={() => submit('upgrade')}
          >
            {t('cmsui.addons.upgrade')}
          </Button>
        ) : null}
        <Button
          className="w-28"
          size="S"
          variant="destructive"
          accent
          isDisabled={busy}
          onPress={() => submit('uninstall')}
        >
          {t('cmsui.addons.uninstall')}
        </Button>
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        className="w-28"
        size="S"
        variant="primary"
        accent
        isDisabled={busy}
        onPress={() => submit('install')}
      >
        {t('cmsui.addons.install')}
      </Button>
      {error}
    </div>
  );
}

function UpgradeButton({ addon }: { addon: SiteAddon }) {
  const { t } = useTranslation();
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== 'idle';
  return (
    <Button
      className="w-28"
      size="S"
      variant="primary"
      isDisabled={busy}
      onPress={() =>
        fetcher.submit({ id: addon.id, intent: 'upgrade' }, { method: 'post' })
      }
    >
      {t('cmsui.addons.upgrade')}
    </Button>
  );
}

function UpgradesBanner({ addons }: { addons: SiteAddon[] }) {
  const { t } = useTranslation();
  if (addons.length === 0) {
    return null;
  }
  return (
    <section
      className={`mt-10 rounded-lg border border-quanta-banana bg-quanta-cream p-4`}
    >
      <div className="mb-3 flex items-center gap-2">
        <h2 className="addons-section-heading text-quanta-bronze">
          {t('cmsui.addons.updatesAvailable')}
        </h2>
        <CountBadge count={addons.length} tone="muted" />
      </div>
      <ul className="flex list-none flex-col gap-3 p-0">
        {addons.map((addon) => {
          const info = upgradeInfo(addon);
          return (
            <li
              key={addon.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span className="font-medium text-foreground">
                {addon.title || addon.id}
              </span>
              {info.installedVersion && info.newVersion ? (
                <span className="text-xs text-quanta-bronze">
                  {t('cmsui.addons.upgradeFromTo', {
                    from: info.installedVersion,
                    to: info.newVersion,
                  })}
                </span>
              ) : null}
              <span className="ms-auto">
                <UpgradeButton addon={addon} />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CatalogActions({ addon }: { addon: CatalogAddon }) {
  const { t } = useTranslation();
  const href = addon.homepage || addon.repo_url;
  if (!href) {
    return null;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={styles.catalogDetailsLink}
    >
      {t('cmsui.addons.details')}
      <span className="sr-only"> {t('cmsui.addons.opensInNewTab')}</span>
    </a>
  );
}

function CountBadge({ count, tone }: { count: number; tone: Tone }) {
  return (
    <span
      className={
        tone === 'installed'
          ? styles.countBadgeInstalled
          : styles.countBadgeMuted
      }
    >
      {count}
    </span>
  );
}

function CollapsibleSection({
  title,
  count,
  tone,
  defaultOpen,
  forceOpen,
  children,
}: {
  title: string;
  count: number;
  tone: Tone;
  defaultOpen: boolean;
  forceOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen || open;
  return (
    <details
      open={isOpen}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group/section mt-10"
    >
      <summary className={styles.sectionSummary}>
        <h2 className="addons-section-heading text-quanta-turquoise">
          {title}
        </h2>
        <CountBadge count={count} tone={tone} />
        <ChevronDown aria-hidden className={styles.sectionChevron} />
      </summary>
      <div>{children}</div>
    </details>
  );
}

function KindBadge({ kind }: { kind: string }) {
  return <span className={styles.kindBadge}>{kind}</span>;
}

function AddonItem({ item, actions }: { item: ItemView; actions: ReactNode }) {
  const { t } = useTranslation();
  return (
    <details className="group border-b border-border">
      <summary className={styles.addonSummary}>
        <span className="flex-1 font-medium break-words text-foreground">
          {item.title}
        </span>
        {item.kind ? <KindBadge kind={item.kind} /> : null}
        <ChevronDown aria-hidden className={styles.addonChevron} />
      </summary>
      <div className="flex flex-col gap-2 pb-5">
        <code className="text-xs break-all text-quanta-pigeon">
          {item.name}
        </code>
        {item.description ? (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        ) : null}
        {item.pairsWith && item.pairsWith.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{t('cmsui.addons.pairsWith')}:</span>{' '}
            {item.pairsWith.map(partnerLabel).join(', ')}
          </p>
        ) : null}
        {item.upgrade ? (
          <p className="text-xs font-medium text-quanta-emerald">
            {item.upgrade.from && item.upgrade.to
              ? t('cmsui.addons.upgradeFromTo', {
                  from: item.upgrade.from,
                  to: item.upgrade.to,
                })
              : t('cmsui.addons.updatesAvailable')}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {item.version
              ? t('cmsui.addons.latestVersion', { version: item.version })
              : ''}
          </span>
          <div className="ms-auto">{actions}</div>
        </div>
      </div>
    </details>
  );
}

function Pager({
  page,
  totalPages,
  onPrev,
  onNext,
  disabled,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) {
    return null;
  }
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button
        size="S"
        variant="neutral"
        isDisabled={disabled || page <= 1}
        onPress={onPrev}
      >
        {t('cmsui.addons.prev')}
      </Button>
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {t('cmsui.addons.page', { current: page, total: totalPages })}
      </span>
      <Button
        size="S"
        variant="neutral"
        isDisabled={disabled || page >= totalPages}
        onPress={onNext}
      >
        {t('cmsui.addons.next')}
      </Button>
    </div>
  );
}

/** Site add-ons (installed / available): full list from getAddons, client-batched. */
function SiteSection({
  title,
  addons,
  tone,
  forceOpen,
}: {
  title: string;
  addons: SiteAddon[];
  tone: Tone;
  forceOpen: boolean;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(addons.length / BATCH_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * BATCH_SIZE;
  const pageItems = addons.slice(start, start + BATCH_SIZE);

  return (
    <CollapsibleSection
      title={title}
      count={addons.length}
      tone={tone}
      defaultOpen
      forceOpen={forceOpen}
    >
      <div>
        {pageItems.map((addon, index) => (
          <AddonItem
            key={`${addon.id}-${index}`}
            item={siteToItem(addon)}
            actions={<SiteAddonActions addon={addon} />}
          />
        ))}
      </div>
      <Pager
        page={currentPage + 1}
        totalPages={totalPages}
        onPrev={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </CollapsibleSection>
  );
}

/** Catalog: server-paginated + server-searched via @addon-marketplace-search. */
function CatalogSection({
  items,
  total,
  start,
  size,
  busy,
  forceOpen,
  onStart,
}: {
  items: CatalogAddon[];
  total: number;
  start: number;
  size: number;
  busy: boolean;
  forceOpen: boolean;
  onStart: (bStart: number) => void;
}) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.floor(start / size) + 1;

  return (
    <CollapsibleSection
      title={t('cmsui.addons.catalog')}
      count={total}
      tone="muted"
      defaultOpen={false}
      forceOpen={forceOpen}
    >
      <div
        aria-busy={busy}
        className={busy ? 'opacity-50 transition-opacity' : undefined}
      >
        {items.map((addon, index) => (
          <AddonItem
            key={`${addon.id}-${index}`}
            item={catalogToItem(addon)}
            actions={<CatalogActions addon={addon} />}
          />
        ))}
      </div>
      <Pager
        page={page}
        totalPages={totalPages}
        disabled={busy}
        onPrev={() => onStart(Math.max(0, start - size))}
        onNext={() => onStart(start + size)}
      />
    </CollapsibleSection>
  );
}

const siteToItem = (addon: SiteAddon): ItemView => {
  const info = upgradeInfo(addon);
  return {
    title: addon.title || addon.id,
    name: addon.id,
    version: addon.version || undefined,
    description: addon.description || undefined,
    upgrade: info.available
      ? { from: info.installedVersion, to: info.newVersion }
      : undefined,
  };
};

const catalogToItem = (addon: CatalogAddon): ItemView => ({
  title: addon.title || addon.name,
  name: addon.name,
  kind: addon.kind,
  version: addon.latest_version,
  description: addon.summary,
  pairsWith: addon.pairs_with,
});

const siteByName = (a: SiteAddon, b: SiteAddon) =>
  (a.title || a.id).localeCompare(b.title || b.id, undefined, {
    sensitivity: 'base',
  });

export default function AddonsControlPanel() {
  const {
    siteAddons,
    query,
    catalog,
    catalogTotal,
    catalogStart,
    catalogSize,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();

  const [term, setTerm] = useState(query);
  // The query value we last pushed to the URL ourselves, so the effect can tell our own
  // debounced echo apart from an external change (browser back/forward, a shared link).
  const pushedQuery = useRef(query);

  useEffect(() => {
    // Only adopt the URL query when it changed externally; otherwise the echo of our own
    // in-flight push would overwrite characters typed while the search was loading.
    if (query !== pushedQuery.current) {
      pushedQuery.current = query;
      setTerm(query);
    }
  }, [query]);

  const pushQuery = useDebounceCallback((value: string) => {
    pushedQuery.current = value;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set('q', value);
        } else {
          next.delete('q');
        }
        next.delete('b_start');
        return next;
      },
      { replace: true },
    );
  }, SEARCH_DEBOUNCE_MS);

  const onSearchChange = (value: string) => {
    setTerm(value);
    pushQuery(value);
  };

  const goToStart = (bStart: number) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (bStart > 0) {
        next.set('b_start', String(bStart));
      } else {
        next.delete('b_start');
      }
      return next;
    });

  const q = query.trim().toLowerCase();
  const searchActive = q.length > 0;
  const catalogBusy =
    navigation.state === 'loading' &&
    navigation.location?.pathname === '/controlpanel/addons';

  const matchSite = (addon: SiteAddon) =>
    !q ||
    (addon.title || '').toLowerCase().includes(q) ||
    addon.id.toLowerCase().includes(q) ||
    (addon.description || '').toLowerCase().includes(q);

  const installed = siteAddons
    .filter((addon) => addon.is_installed && matchSite(addon))
    .sort(siteByName);
  const available = siteAddons
    .filter((addon) => !addon.is_installed && matchSite(addon))
    .sort(siteByName);
  const upgradable = installed.filter(isUpgradable);

  const totalShown = installed.length + available.length + catalogTotal;

  return (
    <main className="route-addons">
      <Plug pluggable="toolbar-top" id="button-back">
        <Button
          aria-label="back"
          size="L"
          onPress={() => navigate('/controlpanel')}
        >
          <Back aria-hidden />
        </Button>
      </Plug>
      <Container width="default" className="route-controlpanel pb-16">
        <h1
          className={`
            addons-title
            xl:-ms-32
          `}
        >
          {t('cmsui.paneltitles.addons')}
        </h1>

        <div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <input
              type="search"
              value={term}
              onChange={(event) => onSearchChange(event.target.value)}
              aria-label={t('cmsui.addons.searchPlaceholder')}
              placeholder={t('cmsui.addons.searchPlaceholder')}
              className={styles.searchInput}
            />
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {t('cmsui.addons.resultsCount', { total: totalShown })}
          </p>

          {totalShown === 0 ? (
            <p className="mt-8 text-muted-foreground">
              {searchActive
                ? t('cmsui.addons.noMatches')
                : t('cmsui.addons.empty')}
            </p>
          ) : (
            <>
              <UpgradesBanner addons={upgradable} />
              {catalogTotal > 0 ? (
                <CatalogSection
                  items={catalog}
                  total={catalogTotal}
                  start={catalogStart}
                  size={catalogSize}
                  busy={catalogBusy}
                  forceOpen={searchActive}
                  onStart={goToStart}
                />
              ) : null}
              {installed.length > 0 ? (
                <SiteSection
                  title={t('cmsui.addons.installed')}
                  addons={installed}
                  tone="installed"
                  forceOpen={searchActive}
                />
              ) : null}
              {available.length > 0 ? (
                <SiteSection
                  title={t('cmsui.addons.available')}
                  addons={available}
                  tone="muted"
                  forceOpen={searchActive}
                />
              ) : null}
            </>
          )}
          <p className="mt-10 text-sm text-muted-foreground">
            {t('cmsui.addons.installHint')}{' '}
            <a
              href="https://6.docs.plone.org/admin-guide/add-ons.html"
              target="_blank"
              rel="noreferrer"
              className="text-quanta-sapphire underline"
            >
              {t('cmsui.addons.installHintLink')}
            </a>
          </p>
        </div>
      </Container>
    </main>
  );
}
