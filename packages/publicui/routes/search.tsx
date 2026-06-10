import { useTranslation } from 'react-i18next';
import {
  data,
  RouterContextProvider,
  useLoaderData,
  useLocation,
  useNavigation,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { flattenToAppURL } from '@plone/helpers';
import { Container } from '@plone/components/quanta';
import { SearchResults } from '@plone/layout/components/SearchResults/SearchResults';
import { SearchPagination } from '@plone/layout/components/SearchResults/SearchPagination';
import {
  SearchSort,
  sortToQuery,
} from '@plone/layout/components/SearchResults/SearchSort';
import {
  SearchFacets,
  aggregateFacets,
} from '@plone/layout/components/SearchResults/SearchFacets';

export const handle = {
  bodyClass: 'search-route',
};

const PAGE_SIZE = 25;
const FACET_SAMPLE_SIZE = 1000;

export async function loader({
  request,
  params,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);

  const path = `/${params['*'] || ''}`;
  const url = new URL(request.url);
  const query = url.searchParams.get('SearchableText') || '';
  const bStart = Math.max(0, Number(url.searchParams.get('b_start')) || 0);
  const subjects = url.searchParams.getAll('Subject');

  // An empty term with use_site_search_settings returns a bare list, not a
  // batch, so skip the query entirely.
  if (!query) {
    return {
      search: [],
      total: 0,
      params: query,
      bStart,
      bSize: PAGE_SIZE,
      facets: [],
    };
  }

  const baseQuery = {
    SearchableText: `${query}*`,
    path: {
      query: path || '/',
    },
    use_site_search_settings: 1,
  };

  try {
    const [results, facetSample] = await Promise.all([
      cli.search({
        query: {
          ...baseQuery,
          ...(subjects.length > 0 ? { Subject: subjects } : {}),
          b_start: bStart,
          b_size: PAGE_SIZE,
          ...sortToQuery(url.searchParams.get('sort')),
        },
      }),
      cli.search({
        query: {
          ...baseQuery,
          metadata_fields: 'Subject',
          b_size: FACET_SAMPLE_SIZE,
        },
      }),
    ]);

    return {
      // Flatten on the server so result links stay in-app, not the backend.
      search: flattenToAppURL(results.data.items ?? []),
      total: results.data.items_total ?? 0,
      params: query,
      bStart,
      bSize: PAGE_SIZE,
      facets: aggregateFacets(facetSample.data.items ?? []),
    };
  } catch (error: any) {
    throw data('Search failed', {
      status: typeof error.status === 'number' ? error.status : 500,
    });
  }
}

export const meta = () => {
  return [{ title: 'Search' }];
};

export default function SearchRoute() {
  const { t } = useTranslation();
  const { search, total, params, bStart, bSize, facets } =
    useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const location = useLocation();
  const isLoading =
    navigation.state === 'loading' &&
    navigation.location?.pathname === location.pathname;

  return (
    <Container width="default" className="route-search">
      <h1 className="documentFirstHeading">
        {params
          ? `${t('publicui.search.title')} "${params}"`
          : t('publicui.search.results')}
      </h1>
      {/* Search input lives in the site header (issue #59). */}
      <SearchFacets facets={facets} />
      {search.length > 0 ? (
        <>
          <SearchSort />
          <SearchResults items={search} total={total} loading={isLoading} />
          <SearchPagination total={total} bStart={bStart} bSize={bSize} />
        </>
      ) : params ? (
        <p className="noResults">{t('publicui.search.noResults')}</p>
      ) : null}
    </Container>
  );
}
