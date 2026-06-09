import { z } from 'zod';

export const updateSharingDataSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string(),
      roles: z.record(z.string(), z.boolean()),
      type: z.string(),
    }),
  ),
});
