import { apiRequest, type ApiRequestParams } from '../../api';
import type { GetRulesResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export async function getRules(
  this: PloneClient,
  { path = '' }: { path?: string } = {},
): Promise<RequestResponse<GetRulesResponse>> {
  const options: ApiRequestParams = {
    config: this.config,
    params: {},
  };

  return apiRequest(
    'get',
    `${path.replace(/\/$/, '')}/@content-rules`,
    options,
  );
}
