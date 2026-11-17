import { apiRequest, type ApiRequestParams } from '../../api';
import { z } from 'zod';
import type { GetRelationsResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export const getRelationsSchema = z
  .object({
    source: z.string().optional(),
    target: z.string().optional(),
    relation: z.string().optional(),
    onlyBroken: z.boolean().optional(),
  })
  .refine((data) => {
    return (
      data.source !== undefined ||
      data.target !== undefined ||
      data.relation !== undefined
    );
  });

export type RelationsArgs = z.infer<typeof getRelationsSchema>;

export async function getRelations(
  this: PloneClient,
  { source, target, relation, onlyBroken }: RelationsArgs,
): Promise<RequestResponse<GetRelationsResponse>> {
  const validatedArgs = getRelationsSchema.parse({
    source,
    target,
    relation,
    onlyBroken,
  });

  const options: ApiRequestParams = {
    config: this.config,
    params: {
      ...(validatedArgs.source && { source: validatedArgs.source }),
      ...(validatedArgs.target && { target: validatedArgs.target }),
      ...(validatedArgs.relation && { relation: validatedArgs.relation }),
      ...(validatedArgs.onlyBroken && { onlyBroken: validatedArgs.onlyBroken }),
    },
  };

  return apiRequest('get', '/@relations', options);
}
