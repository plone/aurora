import { z } from 'zod';
import { type ApiRequestParams, apiRequest } from '../../api';
import type { RuleResponse as CreateRuleResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

const createRuleArgsSchema = z.object({
  path: z.string(),
  ruleId: z.string(),
});

export type CreateRuleArgs = z.infer<typeof createRuleArgsSchema>;

export async function createRule(
  this: PloneClient,
  args: CreateRuleArgs,
): Promise<RequestResponse<CreateRuleResponse>> {
  const validatedArgs = createRuleArgsSchema.parse(args);

  const options: ApiRequestParams = {
    config: this.config,
  };

  const addRulePath = `${validatedArgs.path}/@content-rules/${validatedArgs.ruleId}`;

  return apiRequest('post', addRulePath, options);
}
