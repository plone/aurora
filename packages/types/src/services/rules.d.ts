export interface RuleResponse {
  message: string;
}

export interface AssignedRule {
  bubbles: boolean;
  description: string;
  enabled: boolean;
  global_enabled: boolean;
  id: string;
  title: string;
  trigger: string;
  url: string;
}

export interface AssignableRule {
  description: string;
  id: string;
  title: string;
}

export interface AcquiredRule {
  description: string;
  enabled: boolean;
  id: string;
  title: string;
  trigger: string;
  url: string;
}

interface ContentRules {
  acquired_rules: AcquiredRule[];
  assignable_rules: AssignableRule[];
  assigned_rules: AssignedRule[];
}

export interface GetRulesResponse {
  'content-rules': ContentRules;
}
