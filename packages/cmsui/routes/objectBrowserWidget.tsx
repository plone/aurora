import {
  data,
  RouterContextProvider,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';
import { getContentPathFromCmsUrl } from '../helpers/cmsPath';

export async function loader({
  params,
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);

  const path = getContentPathFromCmsUrl(`/${params['*'] || ''}`) || '/';

  const query = Object.fromEntries(new URL(request.url).searchParams.entries());

  const pathQuery = {
    query: query['path.query'] || path,
    depth: Number(query['path.depth']) || undefined,
  };

  delete query['path.depth'];
  delete query['path.query'];
  try {
    const { data: results } = await cli.search({
      query: {
        path: pathQuery,
        ...query,
        SearchableText: query.SearchableText
          ? `${query.SearchableText}*`
          : undefined,
      },
    });

    const { data: breadcrumbs } = await cli.getBreadcrumbs({
      path,
    });

    return data(flattenToAppURL({ results, breadcrumbs }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return data(
      {
        results: { items: [] },
        breadcrumbs: { items: [] },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
