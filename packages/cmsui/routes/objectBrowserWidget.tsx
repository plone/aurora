import {
  data,
  RouterContextProvider,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';

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
  // The root middleware doesn't load the browsed folder for this route
  // (`skipContent`), so a folder that doesn't exist gets here. It gives an
  // empty listing, instead of an error replacing the form the browser is
  // used in.
  let results;
  let breadcrumbs;
  try {
    [{ data: results }, { data: breadcrumbs }] = await Promise.all([
      cli.search({
        query: {
          path: pathQuery,
          ...query,
          SearchableText: query.SearchableText
            ? `${query.SearchableText}*`
            : undefined,
        },
      }),
      cli.getBreadcrumbs({
        path,
      }),
    ]);
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (!status || status >= 500) throw error;
    results = { '@id': '', items: [], items_total: 0 };
    breadcrumbs = { '@id': '', items: [] };
  }
  // const items = response.items;
  // const firstLevelIds = items
  //   .filter((i) => i['@id'].split('/').length > 1)
  //   .map((i) => i['@id']);

  // const results = firstLevelIds.reduce((acc, curr) => {
  //   const child = items.some((item) => item['@id'] === curr);

  //   return [acc, ...;
  // }, []);
  // Has to be used?
  // const strippedRequest = new Request(request.url.replace(/\?.*$/, ''), {
  //   headers: request.headers,
  // });

  return data(flattenToAppURL({ results, breadcrumbs }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
