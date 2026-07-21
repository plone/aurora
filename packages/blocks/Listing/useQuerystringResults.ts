import { useEffect, useMemo, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { useDebounceValue } from 'usehooks-ts';
import type { QuerystringValue } from '../../cmsui/components/QuerystringWidget/QuerystringWidgetContext';
import type { QuerystringSearchResult } from '../../cmsui/routes/querystringSearch';

/**
 * Convert sort_order to string format.
 * Handles both boolean (true = descending, false = ascending) and string values.
 */
function normalizeSortOrder(
  sortOrder: string | boolean | undefined,
): 'ascending' | 'descending' | undefined {
  if (sortOrder === undefined || sortOrder === null) return undefined;
  if (typeof sortOrder === 'boolean') {
    return sortOrder ? 'descending' : 'ascending';
  }
  if (sortOrder === 'ascending' || sortOrder === 'descending') {
    return sortOrder;
  }
}

/**
 * Build query parameters object with all supported fields.
 * Only includes fields that have values (following Volto's pattern).
 */
function buildQueryParams(querystring: QuerystringValue | undefined) {
  if (!querystring) return null;

  const params: {
    query?: QuerystringValue['query'];
    sort_on?: string;
    sort_order?: string;
    b_size?: string;
    limit?: string;
  } = {};

  if (querystring.query && querystring.query.length > 0) {
    params.query = querystring.query;
  }

  if (querystring.sort_on) {
    params.sort_on = querystring.sort_on;
  }

  const normalizedSortOrder = normalizeSortOrder(querystring.sort_order);
  if (normalizedSortOrder) {
    params.sort_order = normalizedSortOrder;
  }

  if (querystring.b_size !== undefined && querystring.b_size !== null) {
    params.b_size = String(querystring.b_size);
  }

  if (querystring.limit !== undefined && querystring.limit !== null) {
    params.limit = String(querystring.limit);
  }

  return Object.keys(params).length > 0 ? params : null;
}

export function useQuerystringResults(
  querystring: QuerystringValue | undefined,
) {
  const fetcher = useFetcher<QuerystringSearchResult>();

  const criteria = querystring?.query ?? [];
  const hasCriteria = criteria.length > 0;

  // Build full params signature including all supported fields
  const params = buildQueryParams(querystring);
  const paramsSignature = JSON.stringify(params);
  const [debouncedParamsSignature] = useDebounceValue(paramsSignature, 400);
  const pendingParamsSignature = useRef<string | undefined>(undefined);
  const [loadedParamsSignature, setLoadedParamsSignature] = useState<
    string | undefined
  >(undefined);

  const queryUrl = useMemo(() => {
    const currentParams = JSON.parse(debouncedParamsSignature);
    if (!currentParams?.query?.length) return null;

    // Encode the entire params object as a single query parameter
    const queryString = JSON.stringify(currentParams);
    const encodedQuery = encodeURIComponent(queryString);

    return `/@querystringSearch?query=${encodedQuery}`;
  }, [debouncedParamsSignature]);

  useEffect(() => {
    if (!queryUrl) return;

    pendingParamsSignature.current = debouncedParamsSignature;
    fetcher.load(queryUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryUrl]);

  useEffect(() => {
    if (!fetcher.data || !pendingParamsSignature.current) return;
    setLoadedParamsSignature(pendingParamsSignature.current);
  }, [fetcher.data]);

  const loaded =
    !hasCriteria || loadedParamsSignature === debouncedParamsSignature;
  const items = hasCriteria && loaded ? (fetcher.data?.items ?? []) : [];
  const total = hasCriteria && loaded ? (fetcher.data?.items_total ?? 0) : 0;
  const loading = hasCriteria && fetcher.state !== 'idle';

  return { items, total, loading, loaded };
}
