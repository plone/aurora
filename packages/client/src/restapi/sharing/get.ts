import { z } from 'zod';
import { apiRequest, type ApiRequestParams } from '../../api';
import type { SharingResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

const getSharingSchema = z.object({
  path: z.string(),
  search: z.string().optional(),
});

export type SharingArgs = z.infer<typeof getSharingSchema>;

export async function getSharing(
  this: PloneClient,
  { path, search }: SharingArgs,
): Promise<RequestResponse<SharingResponse>> {
  const validatedArgs = getSharingSchema.parse({
    path,
    search,
  });

  const options: ApiRequestParams = {
    config: this.config,
    params: { search },
  };
  const sharingPath = `${validatedArgs.path}/@sharing`;

  return apiRequest('get', sharingPath, options);
}
