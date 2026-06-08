import { z } from 'zod';
import { apiRequest, type ApiRequestParams } from '../../api';
import { updateSharingDataSchema } from '../../validation/sharing';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export const updateSharingArgsSchema = z.object({
  path: z.string(),
  data: updateSharingDataSchema.optional(),
});

export type UpdateSharingArgs = z.infer<typeof updateSharingArgsSchema>;

export async function updateSharing(
  this: PloneClient,
  { path, data }: UpdateSharingArgs,
): Promise<RequestResponse<void>> {
  const validatedArgs = updateSharingArgsSchema.parse({
    path,
    data,
  });

  const options: ApiRequestParams = {
    data: validatedArgs.data,
    config: this.config,
  };

  const sharingPath = `${validatedArgs.path}/@sharing`;

  return apiRequest('post', sharingPath, options);
}
