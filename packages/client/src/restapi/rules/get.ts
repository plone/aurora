import { z } from 'zod';
import { apiRequest, type ApiRequestParams } from '../../api';
import type { GetRulesResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

const getRulesArgsSchema = z.object({
  path: z.string(),
});

export type GetRulesArgs = z.infer<typeof getRulesArgsSchema>;

export async function getRules(
  this: PloneClient,
  args: GetRulesArgs,
): Promise<RequestResponse<GetRulesResponse>> {
  const validatedArgs = getRulesArgsSchema.parse(args);

  const options: ApiRequestParams = {
    config: this.config,
  };

  const rulesPath = `${validatedArgs.path}/@content-rules`;

  return apiRequest('get', rulesPath, options);
}
