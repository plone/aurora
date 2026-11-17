import { useTranslation } from 'react-i18next';
import {
  data,
  redirect,
  RouterContextProvider,
  useLoaderData,
  useLocation,
  useNavigation,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';
import { Container } from '@plone/quanta';
import { SearchForm } from '../components/SearchResults/SearchForm';
import { SearchResults } from '../components/SearchResults/SearchResults';
import { SearchPagination } from '../components/SearchResults/SearchPagination';
import { sortToQuery } from '../components/SearchResults/SearchSort';

export const handle = {
  bodyClass: 'search-route',
};

const PAGE_SIZE = 25;

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);

  const url = new URL(request.url);
  const query = (url.searchParams.get('SearchableText') || '').trim();
  const requestedStart = Math.max(
    0,
    Number(url.searchParams.get('b_start')) || 0,
  );
  // Snap to a page boundary so pagination never yields overlapping pages.
  const bStart = Math.floor(requestedStart / PAGE_SIZE) * PAGE_SIZE;
  const path = url.searchParams.get('path')?.replace(/\/+$/, '');
  const root = path?.startsWith('/') ? path : null;

  let results;
  try {
    results = await cli.search({
      query: {
        // An empty SearchableText with use_site_search_settings returns a bare
        // list instead of a batch, so omit it to search everything.
        ...(query ? { SearchableText: `${query}*` } : {}),
        use_site_search_settings: 1,
        ...(root ? { path: { query: root } } : {}),
        b_start: bStart,
        b_size: PAGE_SIZE,
        ...sortToQuery(url.searchParams.get('sort')),
      },
    });
  } catch (error: any) {
    throw data('Search failed', {
      status: typeof error.status === 'number' ? error.status : 500,
    });
  }

  const total = results.data.items_total ?? 0;

  if (total > 0 && bStart >= total) {
    const lastStart = Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE;
    if (lastStart > 0) {
      url.searchParams.set('b_start', String(lastStart));
    } else {
      url.searchParams.delete('b_start');
    }
    throw redirect(`${url.pathname}?${url.searchParams.toString()}`);
  }

  return {
    search: flattenToAppURL(results.data.items ?? []),
    total,
    params: query,
    bStart,
    bSize: PAGE_SIZE,
  };
}

export const meta = () => {
  return [{ title: 'Search' }];
};

export default function SearchRoute() {
  const { t } = useTranslation();
  const { search, total, params, bStart, bSize } =
    useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const location = useLocation();
  const isLoading =
    navigation.state === 'loading' &&
    navigation.location?.pathname === location.pathname;

  return (
    <div className="content-area">
      <Container width="default" className="route-search">
        <h1 className="documentFirstHeading">{t('publicui.search.heading')}</h1>
        <SearchForm />
        <SearchResults
          items={search}
          total={total}
          query={params}
          bStart={bStart}
          loading={isLoading}
        />
        <SearchPagination total={total} bStart={bStart} bSize={bSize} />
      </Container>
    </div>
  );
}
