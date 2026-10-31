import { z } from 'zod';
import { apiRequest, type ApiRequestParams } from '../../api';
import { updateTypeSchemaDataSchema } from '../../validation/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export const updateTypeSchemaArgsSchema = z.object({
  type: z.string(),
  data: updateTypeSchemaDataSchema,
});

export type UpdateTypeSchemaArgs = z.infer<typeof updateTypeSchemaArgsSchema>;

/**
 * Replaces the fields and fieldsets a type adds itself, from a schema in
 * the shape `getType` returns: adds, changes, moves and deletes them.
 */
export async function updateTypeSchema(
  this: PloneClient,
  { type, data }: UpdateTypeSchemaArgs,
): Promise<RequestResponse<undefined>> {
  const validatedArgs = updateTypeSchemaArgsSchema.parse({ type, data });

  const options: ApiRequestParams = {
    data: validatedArgs.data,
    config: this.config,
  };

  return apiRequest('put', `/@types/${validatedArgs.type}`, options);
}
