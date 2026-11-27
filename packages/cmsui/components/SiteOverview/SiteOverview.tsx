import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@plone/quanta';
import type { GetSiteResponse, GetSystemResponse } from '@plone/types';
import appInfo from '@plone/registry/app-info';
import { CheckboxIcon } from '@plone/icons';
import CopyButton from '../CopyButton/CopyButton';
import ArrowRight from '@plone/icons/svg/arrow-right.svg?react';

interface SiteOverviewProps {
  system: GetSystemResponse;
  addons?: {
    name: string;
    version: string;
  }[];
  site?: Partial<GetSiteResponse>;
  /** The address visitors reach the site at. Defaults to the browser's. */
  siteUrl?: string;
}

const cardClassName = 'flex flex-col gap-4 rounded-[10px] border p-5';

// The apps that are Plone Aurora itself: the framework package, as the app was
// named before, and the app that develops it. Their version is Aurora's.
const AURORA_APPS = ['@plone/aurora', '@plone/aurora-dev'];

const Details = ({ entries }: { entries: [string, string | undefined][] }) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px] leading-4.5">
    {entries
      .filter(([, value]) => value)
      .map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="overflow-hidden text-ellipsis whitespace-nowrap text-quanta-pigeon">
            {term}
          </dt>
          <dd
            className="m-0 truncate text-right text-quanta-denim tabular-nums"
            title={value}
          >
            {value}
          </dd>
        </div>
      ))}
  </dl>
);

/**
 * The site and the software it runs on, beside the control panels.
 */
const SiteOverview = ({
  system,
  addons,
  site,
  siteUrl: siteUrlProp,
}: SiteOverviewProps) => {
  const { t } = useTranslation();

  // Only known in the browser: the server may be reached at an internal
  // address, behind a proxy, and the clipboard needs a secure origin.
  const [siteUrl, setSiteUrl] = useState(siteUrlProp);
  const [canCopy, setCanCopy] = useState(false);

  useEffect(() => {
    setSiteUrl(siteUrlProp ?? window.location.origin);
    setCanCopy(Boolean(navigator.clipboard));
  }, [siteUrlProp]);

  addons = addons || appInfo.addons;

  const title = site?.['plone.site_title'] || 'Plone';

  // Python's version string carries the build details after the number.
  const [pythonVersion] = system.python_version?.split(' ') ?? [];

  // The Plone Aurora framework the app is built on. Before the framework was
  // its own package, the app itself was `@plone/aurora`.
  const isAuroraApp = AURORA_APPS.includes(appInfo.name);
  const auroraVersion =
    appInfo.aurora ??
    (appInfo.name === '@plone/aurora' ? appInfo.version : undefined);

  const versions: [string, string | undefined][] = useMemo(
    () => [
      ['Plone', system.plone_version],
      ['Plone Aurora', auroraVersion],
      // A project's own app, but not the app that develops Plone Aurora
      ...(isAuroraApp
        ? []
        : [[appInfo.name, appInfo.version] as [string, string]]),
      ['plone.restapi', system.plone_restapi_version],
      ['Zope', system.zope_version],
      ['Python', pythonVersion],
      ['CMF', system.cmf_version],
      ['PIL', system.pil_version],
      [t('cmsui.siteOverview.debugMode'), system.debug_mode],
    ],
    [system, pythonVersion, t, auroraVersion, isAuroraApp],
  );

  const copySystemInfo = useCallback(() => {
    // The full Python version string helps when reporting a problem.
    let text = [
      ...versions.map(([term, value]): [string, string | undefined] =>
        term === 'Python' ? [term, system.python_version] : [term, value],
      ),
      ['GenericSetup profile', system.plone_gs_metadata_version_installed],
    ]
      .filter(([, value]) => value)
      .map(([term, value]) => `${term}: ${value}`)
      .join('\n');

    if (addons.length > 0) {
      text +=
        '\n\nAdd-ons:\n\n' +
        addons.map(({ name, version }) => `${name}: ${version}`).join('\n');
    }

    return text;
  }, [
    versions,
    system.plone_gs_metadata_version_installed,
    system.python_version,
    addons,
  ]);

  return (
    <aside className="siteoverview flex flex-col gap-4">
      <section
        className={`
          ${cardClassName}
          border-quanta-smoke
        `}
        aria-labelledby="siteoverview-site"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`
              flex size-11 shrink-0 items-center justify-center rounded-full bg-quanta-sapphire
              text-lg font-bold text-quanta-air
            `}
          >
            {title.charAt(0).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-col">
            <h2
              id="siteoverview-site"
              className="truncate text-base leading-5.5 font-semibold text-quanta-denim"
            >
              {title}
            </h2>
            {/* The address is known only in the browser: until then, its
              line is kept, so the title doesn't move. */}
            {siteUrl ? (
              <a
                href={siteUrl}
                className={`
                  truncate text-[13px] leading-4.5 text-quanta-sapphire no-underline
                  hover:text-quanta-royal
                `}
              >
                {siteUrl.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span aria-hidden="true" className="h-4.5" />
            )}
          </div>
        </div>
        <Details
          entries={[
            [
              t('cmsui.siteOverview.language'),
              site?.['plone.default_language'],
            ],
            [t('cmsui.siteOverview.timezone'), site?.['plone.portal_timezone']],
            [
              t('cmsui.siteOverview.multilingual'),
              site?.features
                ? t(
                    site.features.multilingual
                      ? 'cmsui.siteOverview.on'
                      : 'cmsui.siteOverview.off',
                  )
                : undefined,
            ],
          ]}
        />
      </section>

      {/* A pending upgrade marks the whole card, without making it bigger:
        the ring doubles the border outside the layout. The card clips its
        header strip to its rounded corners. */}
      <section
        className={
          system.upgrade
            ? `
              ${cardClassName}
              overflow-hidden border-quanta-lemon ring-1 ring-quanta-lemon
            `
            : `
              ${cardClassName}
              border-quanta-smoke
            `
        }
        aria-labelledby="siteoverview-system"
      >
        {/* With a pending upgrade, the header turns into a yellow strip
          that leads to the upgrade page. */}
        <div
          className={
            system.upgrade
              ? `
                -mx-5 -mt-5 flex items-center justify-between gap-3 rounded-t-[9px] bg-quanta-cream
                px-5 py-3
              `
              : 'flex items-center justify-between gap-3'
          }
        >
          <h2
            id="siteoverview-system"
            className={`
              text-[15px] leading-5.5 font-semibold
              ${system.upgrade ? 'text-quanta-bronze' : 'text-quanta-denim'}
            `}
          >
            {t('cmsui.siteOverview.system')}
          </h2>
          {system.upgrade ? (
            <Link
              href="/@@controlpanel/plone-upgrade"
              className={`
                inline-flex items-center gap-1 text-[13px] font-semibold text-quanta-bronze
                underline
                hover:text-quanta-denim
              `}
            >
              {t('cmsui.siteOverview.runUpgrade')}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span
              className={`
                rounded-full bg-quanta-daiquiri px-2.5 py-0.5 text-xs font-semibold
                text-quanta-turtle
              `}
            >
              <CheckboxIcon size="sm" className="mr-1.25" />
              {t('cmsui.siteOverview.upToDate')}
            </span>
          )}
        </div>
        {system.upgrade && (
          <p className="text-[13px] leading-4.5 text-quanta-iron">
            {t('cmsui.siteOverview.upgrade')}
          </p>
        )}
        <Details entries={versions} />
        <section
          className="border-t border-t-quanta-smoke pt-4.75"
          aria-labelledby="siteoverview-addons"
        >
          <div className="mb-4.75 flex items-center justify-between">
            <h2
              id="siteoverview-addons"
              className="text-[15px] leading-5.5 font-semibold text-quanta-denim"
            >
              {t('cmsui.siteOverview.addons')}
            </h2>
            <span
              className={`
                rounded-[10px] bg-quanta-snow p-[1px_8px] text-[12px] font-semibold text-quanta-iron
                tabular-nums
              `}
            >
              {addons.length}
            </span>
          </div>
          <Details
            entries={addons.map((addon) => [addon.name, addon.version])}
          />
          {canCopy && (
            <CopyButton
              label={t('cmsui.siteOverview.copySystemInfo')}
              onCopyRequested={copySystemInfo}
            />
          )}
        </section>
      </section>
    </aside>
  );
};

export default SiteOverview;
