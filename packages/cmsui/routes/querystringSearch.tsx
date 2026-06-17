import {
  data,
  RouterContextProvider,
  type LoaderFunctionArgs,
} from 'react-router';
import { flattenToAppURL } from '@plone/helpers';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import type { Brain } from '@plone/types';

export interface QuerystringSearchResult {
  items: Brain[];
  items_total: number;
}

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);

  const url = new URL(request.url);
  const queryParam = url.searchParams.get('query');

  const empty: QuerystringSearchResult = { items: [], items_total: 0 };

  if (!queryParam) {
    return data(empty, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse the query parameter as JSON (contains all params: query, sort_on, etc.)
    let queryObject;
    try {
      queryObject = JSON.parse(decodeURIComponent(queryParam));
    } catch {
      return data(empty, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!queryObject.query?.length) {
      return data(empty, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pass the entire query object to cli.querystringSearch()
    const { data: results } = await cli.querystringSearch(queryObject);
    const flattened = results
      ? flattenToAppURL(results)
      : { items: [], items_total: 0 };

    return data(
      {
        items: flattened.items ?? [],
        items_total: flattened.items_total ?? 0,
      } satisfies QuerystringSearchResult,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch querystring-search results:', error);
    return data(empty, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
