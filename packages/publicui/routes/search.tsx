import { useTranslation } from 'react-i18next';
import {
  data,
  Form,
  RouterContextProvider,
  useLoaderData,
  type LoaderFunctionArgs,
} from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { Container, Input } from '@plone/components/quanta';
import { SearchResults } from '../components/SearchResults/SearchResults';
import styles from '../components/SearchResults/SearchResults.module.css';

export const handle = {
  bodyClass: 'search-route',
};

export async function loader({
  request,
  params,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);

  const path = `/${params['*'] || ''}`;
  const url = new URL(request.url);
  const query = url.searchParams.get('SearchableText') || '';

  try {
    const results = await cli.search({
      query: {
        SearchableText: query ? `${query}*` : '',
        path: {
          query: path || '/',
        },
      },
    });

    return {
      search: results.data.items,
      total: results.data.items_total,
      params: query,
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
  const { search, total, params } = useLoaderData<typeof loader>();

  return (
    <Container width="default" className="route-search">
      <h1 className="documentFirstHeading">
        {params
          ? `${t('publicui.search.title')} "${params}"`
          : t('publicui.search.results')}
      </h1>
      <Form>
        <Input
          type="search"
          id="search"
          name="SearchableText"
          placeholder={t('publicui.search.placeholder')}
        />
        {/* <Icon name={zoomSVG} size="18px" /> */}
      </Form>
      {search?.length > 0 ? (
        <>
          <p className={styles.count}>
            {t('publicui.search.count', { count: total })}
          </p>
          <SearchResults items={search} />
        </>
      ) : (
        <div>
          <p className="noResults">{t('publicui.search.noResults')}</p>
        </div>
      )}
    </Container>
  );
}
