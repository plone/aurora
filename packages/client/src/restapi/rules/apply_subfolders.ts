import {
  rulesActionArgsSchema,
  type RulesActionArgs,
} from '../../validation/rules';
import { patchContentRules } from './utils';
import type { RuleResponse as ApplyRulesToSubfoldersResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export async function applyRulesToSubfolders(
  this: PloneClient,
  args: RulesActionArgs,
): Promise<RequestResponse<ApplyRulesToSubfoldersResponse>> {
  const { path, ruleIds } = rulesActionArgsSchema.parse(args);

  return patchContentRules(this.config, path, {
    'form.button.Bubble': true,
    rule_ids: ruleIds,
  });
}
