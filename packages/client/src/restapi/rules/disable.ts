import {
  rulesActionArgsSchema,
  type RulesActionArgs,
} from '../../validation/rules';
import { patchContentRules } from './utils';
import type { RuleResponse as DisableRulesResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export async function disableRules(
  this: PloneClient,
  args: RulesActionArgs,
): Promise<RequestResponse<DisableRulesResponse>> {
  const { path, ruleIds } = rulesActionArgsSchema.parse(args);

  return patchContentRules(this.config, path, {
    'form.button.Disable': true,
    rule_ids: ruleIds,
  });
}
