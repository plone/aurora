import { apiRequest, type ApiRequestParams } from '../../api';
import { z } from 'zod';
import { deleteRulesDataSchema } from '../../validation/rules';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export const deleteRulesArgsSchema = z.object({
  data: deleteRulesDataSchema,
  path: z.string().optional(),
});

type DeleteRulesArgs = z.infer<typeof deleteRulesArgsSchema>;

export async function deleteRules(
  this: PloneClient,
  { data, path }: DeleteRulesArgs,
): Promise<RequestResponse<undefined>> {
  const validatedArgs = deleteRulesArgsSchema.parse({
    data,
    path,
  });

  const options: ApiRequestParams = {
    data: validatedArgs.data,
    config: this.config,
  };

  const deleteRulesPath = `${(validatedArgs.path ?? '').replace(/\/$/, '')}/@content-rules`;

  return apiRequest('delete', deleteRulesPath, options);
}
