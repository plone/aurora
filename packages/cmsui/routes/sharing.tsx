import type { LoaderFunctionArgs } from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { data, RouterContextProvider, useLoaderData } from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';
import { useTranslation } from 'react-i18next';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const contentPath = content?.['@id'] ?? '/';

  const { data: sharingData } = await cli.getSharing({ path: contentPath });

  return data(flattenToAppURL({ content, sharingData }));
}

export default function Sharing() {
  const { content, sharingData } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <div>
      <b>{t('cmsui.sharing.label')}:</b>
      <p>
        Sharing Form for {content['@id']}, inherit:{' '}
        {(sharingData.inherit && 'True') || 'False'}
      </p>
    </div>
  );
}
