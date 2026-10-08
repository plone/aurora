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
import VersionOverview from '../components/VersionOverview/VersionOverview';
import Back from '@plone/icons/svg/arrow-left.svg?react';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);

  const [controlpanelsRes, sysInfoRes] = await Promise.all([
    cli.getControlpanels(),
    cli.getSystem(),
  ]);
  return {
    controlpanels: controlpanelsRes.data,
    systemInformation: sysInfoRes.data,
  };
}

export default function ControlPanels() {
  const { controlpanels, systemInformation } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  return (
    <main>
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href="/">
          <Back />
        </Link>
      </Plug>
      <Container width="default" className="route-controlpanel">
        <h1 className="documentFirstHeading">{t('cmsui.controlpanel')}</h1>
        <ControlPanelsList controlpanels={controlpanels ?? []} />
        <VersionOverview {...systemInformation} />
      </Container>
    </main>
  );
}
