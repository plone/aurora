import { useState } from 'react';
import {
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import { Button, Checkbox, Container, Link } from '@plone/quanta';
import { Plug } from '@plone/layout/components/Pluggable';
import type { RunUpgradeResponse } from '@plone/types';
import Back from '@plone/icons/svg/arrow-left.svg?react';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const upgradeRes = await cli.getUpgrade();

  return { upgrade: upgradeRes.data };
}

export type UpgradeActionResult =
  | ({ ok: true } & Pick<RunUpgradeResponse, 'dry_run' | 'report'>)
  | { ok: false; error: string };

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>): Promise<UpgradeActionResult> {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const formData = await request.formData();
  const dryRun = formData.get('dry_run') === 'true';

  try {
    const { data } = await cli.runUpgrade({ data: { dry_run: dryRun } });
    return { ok: true, dry_run: data.dry_run, report: data.report };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const cardClassName =
  'flex flex-col gap-4 rounded-[10px] border border-quanta-smoke p-5';

const sectionHeadingClassName =
  'text-[15px] leading-[22px] font-semibold text-quanta-denim';

/**
 * Runs the upgrade steps of the Plone site profile, like the backend's
 * `@@plone-upgrade` page, through the `@upgrade` endpoint.
 */
export default function UpgradeControlPanel() {
  const { upgrade } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<UpgradeActionResult>();
  const { t } = useTranslation();
  const [dryRun, setDryRun] = useState(false);

  const { versions } = upgrade;
  const upToDate = versions.fs === versions.instance;
  const stepGroups = Object.entries(upgrade.upgrade_steps ?? {});
  const running = fetcher.state !== 'idle';
  const result = fetcher.data;

  return (
    <main className="route-upgrade">
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href="/@@controlpanel">
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
            href="/@@controlpanel"
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
            {t('cmsui.upgrade.title')}
          </h1>
          <p className="text-sm text-quanta-iron">
            {t('cmsui.upgrade.description')}{' '}
            <a
              href="https://6.docs.plone.org/backend/upgrading/index.html"
              target="_blank"
              rel="noreferrer"
              className="text-quanta-sapphire underline"
            >
              {t('cmsui.upgrade.docsLink')}
            </a>
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <section
            className={
              upToDate
                ? `
                  ${cardClassName}
                `
                : `
                  ${cardClassName}
                  border-quanta-lemon ring-1 ring-quanta-lemon
                `
            }
            aria-labelledby="upgrade-versions"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="upgrade-versions" className={sectionHeadingClassName}>
                {t('cmsui.upgrade.versions')}
              </h2>
              {upToDate ? (
                <span
                  className={`
                    rounded-full bg-quanta-daiquiri px-2.5 py-0.5 text-xs font-semibold
                    text-quanta-turtle
                  `}
                >
                  {t('cmsui.siteOverview.upToDate')}
                </span>
              ) : (
                <span
                  className={`
                    rounded-full bg-quanta-cream px-2.5 py-0.5 text-xs font-semibold
                    text-quanta-bronze
                  `}
                >
                  {t('cmsui.siteOverview.upgradeAvailable')}
                </span>
              )}
            </div>
            <p className="text-[13px] leading-[18px] text-quanta-iron">
              {upToDate
                ? t('cmsui.upgrade.upToDate')
                : t('cmsui.upgrade.outdated')}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px] leading-[18px]">
              <dt className="text-quanta-pigeon">
                {t('cmsui.upgrade.instanceVersion')}
              </dt>
              <dd className="text-quanta-denim tabular-nums">
                {versions.instance}
              </dd>
              <dt className="text-quanta-pigeon">
                {t('cmsui.upgrade.fsVersion')}
              </dt>
              <dd className="text-quanta-denim tabular-nums">{versions.fs}</dd>
            </dl>
          </section>

          {stepGroups.length > 0 && (
            <section className={cardClassName} aria-labelledby="upgrade-steps">
              <h2 id="upgrade-steps" className={sectionHeadingClassName}>
                {t('cmsui.upgrade.steps')}
              </h2>
              <p className="text-[13px] leading-[18px] text-quanta-iron">
                {t('cmsui.upgrade.stepsDescription')}
              </p>
              <div className="flex flex-col gap-3">
                {stepGroups.map(([group, steps]) => (
                  <div key={group} className="flex flex-col gap-1">
                    <h3 className="text-[13px] font-semibold text-quanta-denim tabular-nums">
                      {group}
                    </h3>
                    <ul className="list-disc pl-5 text-[13px] leading-[20px] text-quanta-iron">
                      {steps.map((step) => (
                        <li key={step.id}>{step.title}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p
                className={`
                  rounded-lg border border-quanta-flamingo bg-quanta-ballet px-3 py-2 text-[13px]
                  leading-[18px] text-quanta-wine
                `}
              >
                {t('cmsui.upgrade.backup')}
              </p>
              <fetcher.Form
                method="post"
                className="flex flex-wrap items-center gap-4"
              >
                <input type="hidden" name="dry_run" value={String(dryRun)} />
                <Button
                  type="submit"
                  variant="primary"
                  accent
                  isPending={running}
                >
                  {t('cmsui.upgrade.run')}
                </Button>
                <Checkbox isSelected={dryRun} onChange={setDryRun}>
                  {t('cmsui.upgrade.dryRun')}
                </Checkbox>
              </fetcher.Form>
            </section>
          )}

          {result && (
            <section className={cardClassName} aria-labelledby="upgrade-report">
              <h2 id="upgrade-report" className={sectionHeadingClassName}>
                {t('cmsui.upgrade.report')}
              </h2>
              <p
                role={result.ok ? 'status' : 'alert'}
                className={`
                  text-[13px] leading-[18px]
                  ${result.ok ? 'text-quanta-turtle' : `text-quanta-candy`}
                `}
              >
                {!result.ok
                  ? t('cmsui.upgrade.error')
                  : result.dry_run
                    ? t('cmsui.upgrade.dryRunDone')
                    : t('cmsui.upgrade.done')}
              </p>
              <pre
                className={`
                  max-h-96 overflow-auto rounded-lg bg-quanta-snow p-3 text-xs leading-[18px]
                  whitespace-pre-wrap text-quanta-iron
                `}
              >
                {result.ok ? result.report : result.error}
              </pre>
            </section>
          )}
        </div>
      </Container>
    </main>
  );
}
