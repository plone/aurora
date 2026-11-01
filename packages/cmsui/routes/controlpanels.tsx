import {
  RouterContextProvider,
  useLoaderData,
  type LoaderFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import { Container, Link } from '@plone/quanta';
import { Plug } from '@plone/layout/components/Pluggable';
import ControlPanelsList from '../components/ControlPanel/ControlPanelsList';
import SiteOverview from '../components/SiteOverview/SiteOverview';
import Back from '@plone/icons/svg/arrow-left.svg?react';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);

  const [controlpanelsRes, systemRes, siteRes] = await Promise.all([
    cli.getControlpanels(),
    cli.getSystem(),
    cli.getSite(),
  ]);
  return {
    controlpanels: controlpanelsRes.data,
    system: systemRes.data,
    site: siteRes.data,
    siteUrl: new URL(request.url).origin,
  };
}

export default function ControlPanels() {
  const { controlpanels, system, site, siteUrl } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();
  return (
    <main>
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href="/">
          <Back />
        </Link>
      </Plug>
      <Container
        width="layout"
        className={`
          route-controlpanel px-4 pt-6 pb-16
          md:px-12 md:pt-12
        `}
      >
        <h1 className="documentFirstHeading mb-5 text-[28px] leading-[34px] font-bold">
          {t('cmsui.siteSetup')}
        </h1>
        <div className="flex flex-wrap items-start gap-8">
          <div className="min-w-0 flex-[999_1_520px]">
            <ControlPanelsList controlpanels={controlpanels ?? []} />
          </div>
          <div
            className={`
              max-w-full flex-[1_1_300px]
              lg:pt-[68px]
            `}
          >
            <SiteOverview system={system} site={site} siteUrl={siteUrl} />
          </div>
        </div>
      </Container>
    </main>
  );
}
