import {
  data,
  RouterContextProvider,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';

function emptyOnClientError<T>(empty: T) {
  return (error: unknown): T => {
    const status = (error as { status?: number })?.status;
    if (!status || status >= 500) throw error;
    return empty;
  };
}

export async function loader({
  params,
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);

  const path = `/${params['*'] || ''}`;

  const query = Object.fromEntries(new URL(request.url).searchParams.entries());

  const pathQuery = {
    query: query['path.query'] || path,
    depth: Number(query['path.depth']) || undefined,
  };

  delete query['path.depth'];
  delete query['path.query'];
  // The root middleware doesn't load the browsed folder for this resource
  // route, so a folder that doesn't exist gets here. A request the
  // API rejects (that folder, or an invalid query) gives an empty part,
  // instead of an error replacing the form the browser is used in.
  const [results, breadcrumbs] = await Promise.all([
    cli
      .search({
        query: {
          path: pathQuery,
          ...query,
          SearchableText: query.SearchableText
            ? `${query.SearchableText}*`
            : undefined,
        },
      })
      .then(
        ({ data }) => data,
        emptyOnClientError({ '@id': '', items: [], items_total: 0 }),
      ),
    cli
      .getBreadcrumbs({ path })
      .then(({ data }) => data, emptyOnClientError({ '@id': '', items: [] })),
  ]);

  return data(flattenToAppURL({ results, breadcrumbs }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
