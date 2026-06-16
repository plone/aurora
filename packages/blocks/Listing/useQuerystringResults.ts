import { useEffect } from 'react';
import { useFetcher } from 'react-router';
import { useDebounceValue } from 'usehooks-ts';
import type { QuerystringValue } from '../../cmsui/components/QuerystringWidget/QuerystringWidgetContext';
import type { QuerystringSearchResult } from '../../cmsui/routes/querystringSearch';

export function useQuerystringResults(
  querystring: QuerystringValue | undefined,
) {
  const fetcher = useFetcher<QuerystringSearchResult>();

  const criteria = querystring?.query ?? [];
  const hasCriteria = criteria.length > 0;
  const querySignature = JSON.stringify(criteria);
  const [debouncedQuerySignature] = useDebounceValue(querySignature, 400);

  useEffect(() => {
    const criteria = JSON.parse(debouncedQuerySignature);
    if (!criteria || criteria.length === 0) return;

    fetcher.load(
      `/@querystringSearch?query=${encodeURIComponent(debouncedQuerySignature)}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuerySignature]);

  const items = hasCriteria ? (fetcher.data?.items ?? []) : [];
  const total = hasCriteria ? (fetcher.data?.items_total ?? 0) : 0;
  const loading = hasCriteria && fetcher.state !== 'idle';

  return { items, total, loading };
}
