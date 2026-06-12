import {
  rulesActionArgsSchema,
  type RulesActionArgs,
} from '../../validation/rules';
import { patchContentRules } from './utils';
import type { RuleResponse as EnableRulesResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export async function enableRules(
  this: PloneClient,
  args: RulesActionArgs,
): Promise<RequestResponse<EnableRulesResponse>> {
  const { path, ruleIds } = rulesActionArgsSchema.parse(args);

  return patchContentRules(this.config, path, {
    'form.button.Enable': true,
    rule_ids: ruleIds,
  });
}
