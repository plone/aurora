import { z } from 'zod';

export const rulesActionArgsSchema = z.object({
  path: z.string(),
  ruleIds: z.array(z.string()).min(1),
});

export type RulesActionArgs = z.infer<typeof rulesActionArgsSchema>;
