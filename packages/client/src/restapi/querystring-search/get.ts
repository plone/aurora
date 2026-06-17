import { apiRequest, type ApiRequestParams } from '../../api';
import { z } from 'zod';
import { querystringSearchDataSchema } from '../../validation/querystring-search';
import type { QuerystringSearchResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export type QuerystringSearchArgs = z.infer<typeof querystringSearchDataSchema>;

export async function querystringSearch(
  this: PloneClient,
  args: QuerystringSearchArgs,
): Promise<RequestResponse<QuerystringSearchResponse>> {
  const {
    query,
    post,
    sort_on,
    sort_order,
    b_size,
    limit,
    b_start,
    fullobjects,
  } = querystringSearchDataSchema.parse(args);

  // Build the complete query object with all parameters
  const queryObject = {
    query,
    ...(sort_on && { sort_on }),
    ...(sort_order && { sort_order }),
    ...(b_size && { b_size }),
    ...(limit && { limit }),
    ...(b_start && { b_start }),
    ...(fullobjects !== undefined && { fullobjects }),
  };

  if (post) {
    const options: ApiRequestParams = {
      data: queryObject,
      config: this.config,
    };

    return apiRequest('post', '/@querystring-search', options);
  } else {
    const querystring = JSON.stringify(queryObject);
    const encodedQuery = encodeURIComponent(querystring);

    const options: ApiRequestParams = {
      config: this.config,
      params: {
        query: encodedQuery,
      },
    };

    return apiRequest('get', '/@querystring-search', options);
  }
}
