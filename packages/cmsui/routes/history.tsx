import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { data, RouterContextProvider, useLoaderData } from 'react-router';
import { Link } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { requireAuthCookie } from '@plone/react-router';
import { Plug } from '@plone/layout/components/Pluggable';
import Back from '@plone/components/icons/arrow-left.svg?react';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';
import type { Content, GetHistoryResponse } from '@plone/types';
import HistoryView from '../components/History/HistoryView';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const contentPath = content?.['@id'] ?? '/';

  const { data: history } = await cli.getHistory({ path: contentPath });

  return data(flattenToAppURL({ content, history }));
}

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const contentPath = content?.['@id'] ?? '/';

  const formData = await request.formData();
  const version = Number(formData.get('version'));

  await cli.revertHistory({ path: contentPath, data: { version } });

  return data({ ok: true });
}

export default function History() {
  const { t } = useTranslation();
  const { content, history } = useLoaderData<typeof loader>();
  const typedContent = content as unknown as Content;

  return (
    <>
      <Plug
        pluggable="toolbar-top"
        id="button-back"
        // @ts-expect-error this is currently typed as never[]
        dependencies={[typedContent['@id']]}
      >
        <Link
          className="secondary"
          aria-label={t('cmsui.history.back')}
          href={typedContent['@id']}
        >
          <Back />
        </Link>
      </Plug>
      <main id="main">
        <HistoryView
          content={typedContent}
          history={history as GetHistoryResponse}
        />
      </main>
    </>
  );
}
