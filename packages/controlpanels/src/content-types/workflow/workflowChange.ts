import type {
  StateVisibility,
  WorkflowChangeGroup,
  WorkflowChangePreview,
  WorkflowInfo,
  WorkflowState,
} from '../types';
import { compareVisibility } from './suggestStateMapping';

/** The dialog's choice for following the site default again. */
export const FOLLOW_DEFAULT = '@default';

/** The dialog's choice for no workflow. */
export const NO_WORKFLOW = '@none';

/** One current state of a type, and where its items go. */
export interface MappingRow {
  /** The current state's id, `''` for types without a workflow. */
  id: string;
  /** Missing for types without a workflow. */
  state?: WorkflowState;
  count: number;
  /** The suggested new state, `null` when the new workflow has none. */
  suggested: string | null;
  /** The chosen new state, missing when the new workflow has none. */
  target?: WorkflowState;
  /**
   * Who sees the items afterwards, compared with now: negative when fewer
   * people, positive when more, `0` when the same.
   */
  change: number;
}

/** The workflow a dialog choice stands for. */
export function chosenWorkflow(
  choice: string,
  defaultWorkflow: string | null,
): string | null {
  if (choice === FOLLOW_DEFAULT) return defaultWorkflow;
  if (choice === NO_WORKFLOW) return null;
  return choice;
}

/**
 * The rows of the mapping step: every state of the current workflow, in its
 * order, with its items and the state they move to, from `stateMap` or the
 * suggestion.
 */
export function mappingRows(
  group: WorkflowChangeGroup,
  /** The new workflow, `null` for no workflow. */
  workflow: string | null,
  workflows: WorkflowInfo[],
  stateMap: Record<string, string>,
): MappingRow[] {
  const source = workflows.find((entry) => entry.id === group.workflow);
  const target = workflows.find((entry) => entry.id === workflow);
  // In the current workflow's order, whatever order the driver sends.
  const position = (id: string) => {
    const index = source?.states.findIndex((state) => state.id === id) ?? -1;
    return index === -1 ? Infinity : index;
  };
  const states = [...group.states].sort(
    (a, b) => position(a.state) - position(b.state),
  );
  return states.map(({ state: id, count, suggested }) => {
    const state = source?.states.find((entry) => entry.id === id);
    const chosen = stateMap[id] ?? suggested;
    const next = target?.states.find((entry) => entry.id === chosen);
    return {
      id,
      state,
      count,
      suggested,
      target: next,
      change: next
        ? compareVisibility(state?.visibility ?? 'unknown', next.visibility)
        : 0,
    };
  });
}

/** The number of items a change moves to another state. */
export function changedItems(preview: WorkflowChangePreview): number {
  return preview.groups.reduce(
    (sum, group) =>
      sum + group.states.reduce((total, entry) => total + entry.count, 0),
    0,
  );
}

/** The state map to send: the choices, with suggestions for the rest. */
export function completeStateMap(
  preview: WorkflowChangePreview,
  choices: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  return Object.fromEntries(
    preview.groups.map((group) => {
      const key = group.workflow ?? '';
      const chosen = choices[key] ?? {};
      return [
        key,
        Object.fromEntries(
          group.states
            .map(({ state, suggested }) => [state, chosen[state] ?? suggested])
            .filter((entry): entry is [string, string] => !!entry[1]),
        ),
      ];
    }),
  );
}

/** Who sees items in the most visible of these states. */
export function mostVisible(
  states: WorkflowState[],
): StateVisibility | undefined {
  return states.reduce<StateVisibility | undefined>(
    (best, state) =>
      !best || compareVisibility(best, state.visibility) > 0
        ? state.visibility
        : best,
    undefined,
  );
}
