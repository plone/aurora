import { apiRequest, type ApiRequestParams } from '../../api';
import {
  rulesActionArgsSchema,
  type RulesActionArgs,
} from '../../validation/rules';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export async function deleteRules(
  this: PloneClient,
  args: RulesActionArgs,
): Promise<RequestResponse<undefined>> {
  const { path, ruleIds } = rulesActionArgsSchema.parse(args);

  const options: ApiRequestParams = {
    data: { rule_ids: ruleIds },
    config: this.config,
  };

  return apiRequest('delete', `${path}/@content-rules`, options);
}
