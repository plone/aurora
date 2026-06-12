import { apiRequest, type ApiRequestParams } from '../../api';
import type { PloneClientConfig } from '../../validation/config';
import type { RuleResponse } from '@plone/types';
import type { RequestResponse } from '../types';

/**
 * Shared PATCH to the `@content-rules` endpoint. plone.restapi still expects
 * the legacy `form.button.*` / `operation` payloads here; the semantic rules
 * methods own that wire mapping so consumers never build it themselves.
 */
export function patchContentRules(
  config: PloneClientConfig,
  path: string,
  data: ApiRequestParams['data'],
): Promise<RequestResponse<RuleResponse>> {
  const options: ApiRequestParams = {
    data,
    config,
  };

  return apiRequest('patch', `${path}/@content-rules`, options);
}
