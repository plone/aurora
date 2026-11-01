import { NO_CAPABILITIES, type ContentTypesCapabilities } from '../driver';
import type {
  AllowedContents,
  ContentTypeChanges,
  ContentTypeSettings,
  ContentTypeSummary,
  StateVisibility,
  VersioningPolicy,
  WorkflowChangeGroup,
  WorkflowChangeRequest,
  WorkflowInfo,
} from '../types';
import { SITE_TYPE } from './dexterityTypes';

// plone.restapi's `@content-types`, `@behaviors` and `@workflows`
// (plone/plone.restapi#2061) describe types, behaviors and workflows in their
// own shapes. These helpers translate them to and from the control panel's
// model (`@plone/controlpanels`).

/** Which of the services of plone/plone.restapi#2061 a backend has. */
export interface ContentTypesBackend {
  contentTypes: boolean;
  behaviors: boolean;
  workflows: boolean;
}

/** The driver's capabilities on a backend. */
export function toCapabilities(
  backend: ContentTypesBackend,
): ContentTypesCapabilities {
  return {
    ...NO_CAPABILITIES,
    ...(backend.contentTypes && {
      globalAllow: true,
      searchable: true,
      defaultPage: true,
      allowDiscussion: true,
      versioning: true,
      copyType: true,
    }),
    ...(backend.behaviors && {
      behaviorOrder: true,
      behaviorDetails: true,
      schemaPreview: true,
    }),
    ...(backend.workflows && { workflows: true, workflowChange: true }),
  };
}

/** A choice in a `@content-types` response: `{ token, title }`. */
type Term = { token: string; title?: string } | string | null | undefined;

const tokenOf = (term: Term) =>
  term && typeof term === 'object' ? term.token : (term ?? undefined);

/** `GET @content-types/{type}`, and each item of `GET @content-types`. */
export interface ContentTypeResponse {
  '@id': string;
  id: string;
  title: string;
  items_total: number;
  data: {
    title?: string;
    description?: string;
    global_allow?: boolean;
    allowed_content_types_mode?: Term;
    allowed_content_types?: Term[];
    searchable?: boolean;
    default_page?: boolean;
    allow_discussion?: boolean;
    versioning?: Term;
    behaviors?: Term[];
    [field: string]: unknown;
  };
  schema: { fieldsets: Array<{ id: string; fields: string[] }> };
  workflow?: { id: string | null; follows_default: boolean };
  /** Not sent yet: every type counts as folderish without it. */
  folderish?: boolean;
}

/** Only Dexterity types have behaviors. */
const isDexterity = (response: ContentTypeResponse) =>
  response.schema.fieldsets.some((fieldset) => fieldset.id === 'behaviors');

const kindOf = (response: ContentTypeResponse) =>
  response.id === SITE_TYPE
    ? 'site'
    : isDexterity(response)
      ? 'dexterity'
      : 'other';

const workflowOf = (response: ContentTypeResponse) =>
  response.workflow && {
    workflow: response.workflow.id,
    followsDefault: response.workflow.follows_default,
  };

/** Turns an item of `GET @content-types` into a list row. */
export function toSummary(response: ContentTypeResponse): ContentTypeSummary {
  const { data } = response;
  return {
    id: response.id,
    title: data.title || response.title,
    description: data.description || undefined,
    kind: kindOf(response),
    count: response.items_total ?? 0,
    globalAllow: data.global_allow,
    workflow: workflowOf(response),
    versioning: tokenOf(data.versioning) as VersioningPolicy | undefined,
  };
}

/** Turns `GET @content-types/{type}` into the control panel's settings. */
export function toSettings(response: ContentTypeResponse): ContentTypeSettings {
  const { data } = response;
  const folderish = response.folderish ?? true;
  const mode = tokenOf(data.allowed_content_types_mode) ?? 'all';
  const types = (data.allowed_content_types ?? [])
    .map(tokenOf)
    .filter((token): token is string => !!token);
  const allowedContents: AllowedContents =
    mode === 'selected'
      ? { mode: 'selected', types }
      : { mode: mode === 'none' ? 'none' : 'all' };
  return {
    id: response.id,
    title: data.title || response.title,
    description: data.description ?? '',
    kind: kindOf(response),
    folderish,
    ...(folderish && { allowedContents }),
    globalAllow: data.global_allow,
    searchable: data.searchable,
    defaultPage: data.default_page,
    allowDiscussion: data.allow_discussion,
    versioning: tokenOf(data.versioning) as VersioningPolicy | undefined,
    behaviors: (data.behaviors ?? [])
      .map(tokenOf)
      .filter((token): token is string => !!token),
    workflow: workflowOf(response),
  };
}

/** Turns changed settings into the body of `PATCH @content-types/{type}`. */
export function toContentTypePatch(
  changes: ContentTypeChanges,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const fields: Array<[keyof ContentTypeChanges, string]> = [
    ['title', 'title'],
    ['description', 'description'],
    ['globalAllow', 'global_allow'],
    ['searchable', 'searchable'],
    ['defaultPage', 'default_page'],
    ['allowDiscussion', 'allow_discussion'],
    ['versioning', 'versioning'],
    ['behaviors', 'behaviors'],
  ];
  for (const [key, field] of fields) {
    if (changes[key] !== undefined) patch[field] = changes[key];
  }
  if (changes.allowedContents) {
    patch.allowed_content_types_mode = changes.allowedContents.mode;
    if (changes.allowedContents.mode === 'selected') {
      patch.allowed_content_types = changes.allowedContents.types;
    }
  }
  return patch;
}

/** `GET @workflows/{id}`. */
export interface WorkflowResponse {
  id: string;
  title: string;
  description?: string;
  initial_state: string;
  states: Array<{
    id: string;
    title: string;
    description?: string;
    transitions: string[];
    visibility: StateVisibility;
  }>;
  transitions: Array<{ id: string; title: string; new_state: string }>;
  types: string[];
}

/** The type that holds comments, whose workflows aren't for content. */
const COMMENT_TYPE = 'Discussion Item';

const RANK: Record<StateVisibility, number> = {
  unknown: 0,
  restricted: 0,
  members: 1,
  anyone: 2,
};

/**
 * Turns `GET @workflows/{id}` into the control panel's model. Plone keeps
 * states in alphabetical order, so they're put in the order items go
 * through them: the initial state, then the others from the least visible
 * to the most, and in the order transitions reach them among equals.
 */
export function toWorkflowInfo(response: WorkflowResponse): WorkflowInfo {
  const byId = new Map(response.states.map((state) => [state.id, state]));
  const transitionTo = new Map(
    response.transitions.map((transition) => [
      transition.id,
      transition.new_state,
    ]),
  );
  const order: string[] = [];
  const queue = byId.has(response.initial_state)
    ? [response.initial_state]
    : [];
  while (queue.length) {
    const id = queue.shift()!;
    if (order.includes(id)) continue;
    order.push(id);
    for (const transition of byId.get(id)?.transitions ?? []) {
      const next = transitionTo.get(transition);
      if (next && byId.has(next) && !order.includes(next)) queue.push(next);
    }
  }
  for (const state of response.states) {
    if (!order.includes(state.id)) order.push(state.id);
  }
  // After the initial state, from the least visible to the most, since
  // items usually get more visible on their way.
  const [initial, ...rest] = order.map((id) => byId.get(id)!);
  const states = initial
    ? [initial, ...rest.sort((a, b) => RANK[a.visibility] - RANK[b.visibility])]
    : [];
  const isForComments =
    response.id.startsWith('comment_') ||
    (response.types.length > 0 &&
      response.types.every((type) => type === COMMENT_TYPE));
  return {
    id: response.id,
    title: response.title,
    description: response.description?.trim() || undefined,
    initialState: response.initial_state,
    scope: isForComments ? 'comments' : 'content',
    states: states.map(({ id, title, description, visibility }) => ({
      id,
      title,
      description: description || undefined,
      visibility,
    })),
    transitions: response.transitions.map((transition) => ({
      id: transition.id,
      title: transition.title,
      from: states
        .filter((state) => state.transitions.includes(transition.id))
        .map((state) => state.id),
      to: transition.new_state,
    })),
  };
}

/** The body of `POST @content-types/{type}/workflow` for one type. */
export function toWorkflowChangeBody(
  request: WorkflowChangeRequest,
  current: string | null,
  dryRun: boolean,
): Record<string, unknown> {
  return {
    ...(request.followDefault
      ? { follows_default: true }
      : { workflow: request.workflow }),
    state_map: request.stateMap?.[current ?? ''] ?? {},
    dry_run: dryRun,
  };
}

/** The response of a dry run of `POST @content-types/{type}/workflow`. */
export interface WorkflowDryRunResponse {
  workflow: string | null;
  current: string | null;
  states: Array<{ id: string; count: number; suggested: string | null }>;
  unaffected: number;
}

/**
 * Merges the dry runs of several types into groups of types that share a
 * current workflow, adding up their items per state.
 */
export function toWorkflowChangeGroups(
  runs: Array<{ type: string; response: WorkflowDryRunResponse }>,
): WorkflowChangeGroup[] {
  const groups: WorkflowChangeGroup[] = [];
  for (const { type, response } of runs) {
    let group = groups.find((entry) => entry.workflow === response.current);
    if (!group) {
      group = {
        workflow: response.current,
        types: [],
        states: response.states.map(({ id, suggested }) => ({
          state: id,
          count: 0,
          suggested,
        })),
      };
      groups.push(group);
    }
    group.types.push(type);
    for (const { id, count } of response.states) {
      const entry = group.states.find((state) => state.state === id);
      if (entry) entry.count += count;
    }
  }
  return groups;
}
