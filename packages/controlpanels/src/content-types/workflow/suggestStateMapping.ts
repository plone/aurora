import type { StateVisibility, WorkflowInfo, WorkflowState } from '../types';

const RANK: Record<StateVisibility, number> = {
  unknown: 0,
  restricted: 0,
  members: 1,
  anyone: 2,
};

/**
 * Compares who can see an item in two states: negative when `to` shows it to
 * fewer people than `from`, positive when to more, `0` when the same.
 */
export function compareVisibility(
  from: StateVisibility,
  to: StateVisibility,
): number {
  return RANK[to] - RANK[from];
}

function pick(
  candidates: WorkflowState[],
  state: WorkflowState,
  target: WorkflowInfo,
): WorkflowState {
  return (
    candidates.find((candidate) => candidate.id === state.id) ??
    candidates.find((candidate) => candidate.title === state.title) ??
    candidates.find((candidate) => candidate.id === target.initialState) ??
    candidates[0]
  );
}

/**
 * Suggests a state in `target` for every state in `source`, so that items
 * keep who can see them.
 *
 * - A state with the same visibility wins. Among several, the one with the
 *   same id, then the same title, then the initial state, then the first.
 * - Without one, the most visible state that still shows the item to fewer
 *   people, so a change never exposes content.
 * - Without that either, the least visible state.
 */
export function suggestStateMapping(
  source: WorkflowInfo,
  target: WorkflowInfo,
): Record<string, string> {
  const ranks = target.states.map((state) => RANK[state.visibility]);
  const mapping: Record<string, string> = {};
  for (const state of source.states) {
    const lower = ranks.filter((rank) => rank <= RANK[state.visibility]);
    const rank = lower.length ? Math.max(...lower) : Math.min(...ranks);
    const candidates = target.states.filter(
      (candidate) => RANK[candidate.visibility] === rank,
    );
    mapping[state.id] = pick(candidates, state, target).id;
  }
  return mapping;
}
