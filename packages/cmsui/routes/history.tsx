import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import {
  data,
  RouterContextProvider,
  useFetcher,
  useLoaderData,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';
import { useTranslation } from 'react-i18next';
import type { GetHistoryResponse } from '@plone/types';

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
  const { content, history } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const fetcher = useFetcher();

  // TODO: replace this list with the quanta Table component and format the
  // timestamp with @internationalized/date. See Volto's History.jsx for the
  // full UX (version comparison/diff, state transitions).
  return (
    <main>
      <h1>{t('cmsui.history.label')}</h1>
      <p>{content['@id']}</p>
      <ul>
        {(history as GetHistoryResponse).map((entry, index) => (
          <li key={index}>
            <b>{entry.actor?.fullname}</b> {entry.transition_title} {entry.time}
            {entry.comments ? <em> ({entry.comments})</em> : null}
            {'version' in entry && entry.may_revert ? (
              <fetcher.Form method="post" style={{ display: 'inline' }}>
                <input type="hidden" name="version" value={entry.version} />
                <button type="submit">{t('cmsui.history.revert')}</button>
              </fetcher.Form>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
