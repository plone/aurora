import type { StateColor, StateVisibility, WorkflowState } from '../types';

/** The colors of the states in the workflows Plone ships with. */
export const DEFAULT_STATE_COLORS: Readonly<Record<string, StateColor>> = {
  private: 'red',
  pending: 'yellow',
  published: 'green',
  external: 'green',
  visible: 'teal',
  internal: 'gray',
  internally_published: 'blue',
};

const VISIBILITY_COLORS: Record<StateVisibility, StateColor> = {
  anyone: 'green',
  members: 'blue',
  restricted: 'gray',
  unknown: 'gray',
};

/**
 * The color to show a workflow state with. The first that applies wins:
 *
 * 1. `overrides`, by state id: what the site configures, which
 *    `useStateColor` takes from `ContentTypesDriverProvider`'s `stateColors`
 * 2. the color the backend sets on the state
 * 3. `DEFAULT_STATE_COLORS`, by state id
 * 4. a color from who can see items in the state, so states of custom
 *    workflows get a meaningful color too
 */
export function stateColor(
  state: Pick<WorkflowState, 'id' | 'visibility' | 'color'>,
  overrides?: Readonly<Record<string, StateColor>>,
): StateColor {
  return (
    overrides?.[state.id] ??
    state.color ??
    DEFAULT_STATE_COLORS[state.id] ??
    VISIBILITY_COLORS[state.visibility]
  );
}
