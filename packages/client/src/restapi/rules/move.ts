import { z } from 'zod';
import { patchContentRules } from './utils';
import type { RuleResponse as MoveRuleResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

const moveRuleArgsSchema = z.object({
  path: z.string(),
  ruleId: z.string(),
  direction: z.enum(['up', 'down']),
});

export type MoveRuleArgs = z.infer<typeof moveRuleArgsSchema>;

export async function moveRule(
  this: PloneClient,
  args: MoveRuleArgs,
): Promise<RequestResponse<MoveRuleResponse>> {
  const { path, ruleId, direction } = moveRuleArgsSchema.parse(args);

  return patchContentRules(this.config, path, {
    operation: direction === 'up' ? 'move_up' : 'move_down',
    rule_id: ruleId,
  });
}
