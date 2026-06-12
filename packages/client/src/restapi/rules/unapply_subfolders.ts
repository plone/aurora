import {
  rulesActionArgsSchema,
  type RulesActionArgs,
} from '../../validation/rules';
import { patchContentRules } from './utils';
import type { RuleResponse as UnapplyRulesToSubfoldersResponse } from '@plone/types';
import type PloneClient from '../../client';
import type { RequestResponse } from '../types';

export async function unapplyRulesToSubfolders(
  this: PloneClient,
  args: RulesActionArgs,
): Promise<RequestResponse<UnapplyRulesToSubfoldersResponse>> {
  const { path, ruleIds } = rulesActionArgsSchema.parse(args);

  return patchContentRules(this.config, path, {
    'form.button.NoBubble': true,
    rule_ids: ruleIds,
  });
}
