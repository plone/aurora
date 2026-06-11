import {
  data,
  RouterContextProvider,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { HandleCatchedError } from '../helpers/Errors';
import { settleItems } from '../helpers/batch';
import { cleanSentinelDate, type PropertyItem } from '../helpers/properties';

// The folder listing only carries catalog metadata, with sentinel dates and no
// `rights`, so load the full objects to pre-fill accurate values.
export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);

  const paths = new URL(request.url).searchParams.getAll('path');
  const items: Array<PropertyItem & { '@id': string }> = [];

  try {
    const results = await Promise.allSettled(
      paths.map((path) => cli.getContent({ path })),
    );
    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        const c = r.value.data;
        items.push({
          '@id': c['@id'],
          effective: cleanSentinelDate(c.effective),
          expires: cleanSentinelDate(c.expires),
          rights: c.rights ?? null,
          creators: c.creators ?? null,
          exclude_from_nav: c.exclude_from_nav ?? null,
        });
      }
    });
  } catch (e) {
    HandleCatchedError(e, 'Error loading properties');
  }

  return data({ items }, 200);
}

interface PropertiesPayload {
  items: Array<{ '@id': string; title: string }>;
  data: Record<string, unknown>;
}

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const cli = context.get(ploneClientContext);
  const payload: PropertiesPayload = await request.json();

  const { ok, errors } = await settleItems(
    payload.items,
    (item) => cli.updateContent({ path: item['@id'], data: payload.data }),
    'Error on properties update',
  );

  return data({ ok, errors }, 200);
}
