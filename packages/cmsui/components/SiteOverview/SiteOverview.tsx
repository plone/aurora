import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@plone/quanta';
import type { GetSiteResponse, GetSystemResponse } from '@plone/types';
import PackageJson from '../../../../apps/aurora/package.json';

interface SiteOverviewProps {
  system: GetSystemResponse;
  site?: Partial<GetSiteResponse>;
  /** The address visitors reach the site at. */
  siteUrl?: string;
}

const cardClassName =
  'flex flex-col gap-4 rounded-[10px] border border-quanta-smoke p-5';

const Details = ({ entries }: { entries: [string, string | undefined][] }) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px] leading-[18px]">
    {entries
      .filter(([, value]) => value)
      .map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-quanta-pigeon">{term}</dt>
          <dd className="truncate text-quanta-denim tabular-nums" title={value}>
            {value}
          </dd>
        </div>
      ))}
  </dl>
);

/**
 * The site and the software it runs on, beside the control panels.
 */
const SiteOverview = ({ system, site, siteUrl }: SiteOverviewProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const title = site?.['plone.site_title'] || 'Plone';
  // Python's version string carries the build details after the number.
  const [pythonVersion] = system.python_version?.split(' ') ?? [];

  const versions: [string, string | undefined][] = [
    ['Plone', system.plone_version],
    ['Plone Aurora', PackageJson.version],
    ['plone.restapi', system.plone_restapi_version],
    ['Zope', system.zope_version],
    ['Python', pythonVersion],
    ['CMF', system.cmf_version],
    ['PIL', system.pil_version],
    [t('cmsui.siteOverview.debugMode'), system.debug_mode],
  ];

  const copySystemInfo = async () => {
    // The full Python version string helps when reporting a problem.
    const text = [
      ...versions.map(([term, value]): [string, string | undefined] =>
        term === 'Python' ? [term, system.python_version] : [term, value],
      ),
      ['GenericSetup profile', system.plone_gs_metadata_version_installed],
    ]
      .filter(([, value]) => value)
      .map(([term, value]) => `${term}: ${value}`)
      .join('\n');
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="siteoverview flex flex-col gap-4">
      <section className={cardClassName} aria-labelledby="siteoverview-site">
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
              className="truncate text-base leading-[22px] font-semibold text-quanta-denim"
            >
              {title}
            </h2>
            {siteUrl && (
              <a
                href={siteUrl}
                className={`
                  truncate text-[13px] leading-[18px] text-quanta-sapphire no-underline
                  hover:text-quanta-royal
                `}
              >
                {siteUrl.replace(/^https?:\/\//, '')}
              </a>
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

      <section className={cardClassName} aria-labelledby="siteoverview-system">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="siteoverview-system"
            className="text-[15px] leading-[22px] font-semibold text-quanta-denim"
          >
            {t('cmsui.siteOverview.system')}
          </h2>
          {system.upgrade ? (
            <span
              className={`
                rounded-full bg-quanta-cream px-2.5 py-0.5 text-xs font-semibold text-quanta-bronze
              `}
            >
              {t('cmsui.siteOverview.upgradeAvailable')}
            </span>
          ) : (
            <span
              className={`
                rounded-full bg-quanta-daiquiri px-2.5 py-0.5 text-xs font-semibold
                text-quanta-turtle
              `}
            >
              {t('cmsui.siteOverview.upToDate')}
            </span>
          )}
        </div>
        {system.upgrade && (
          <p className="text-[13px] leading-[18px] text-quanta-iron">
            {t('cmsui.siteOverview.upgrade')}
          </p>
        )}
        <Details entries={versions} />
        <Button
          variant="neutral"
          accent
          className="self-start text-[13px]"
          onPress={copySystemInfo}
        >
          {copied
            ? t('cmsui.siteOverview.copied')
            : t('cmsui.siteOverview.copySystemInfo')}
        </Button>
      </section>
    </aside>
  );
};

export default SiteOverview;
