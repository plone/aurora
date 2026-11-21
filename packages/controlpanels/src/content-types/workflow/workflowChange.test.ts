import { describe, expect, it } from 'vitest';
import { workflows } from '../mock/fixtures/workflows';
import type { WorkflowChangePreview } from '../types';
import {
  FOLLOW_DEFAULT,
  NO_WORKFLOW,
  changedItems,
  chosenWorkflow,
  completeStateMap,
  mappingRows,
  mostVisible,
} from './workflowChange';

const preview: WorkflowChangePreview = {
  workflow: 'intranet_workflow',
  groups: [
    {
      workflow: 'simple_publication_workflow',
      types: ['Document'],
      states: [
        { state: 'private', count: 1, suggested: 'private' },
        { state: 'pending', count: 0, suggested: 'private' },
        { state: 'published', count: 2, suggested: 'external' },
      ],
    },
  ],
  unaffected: 0,
};

describe('workflowChange', () => {
  it('turns dialog choices into workflows', () => {
    expect(chosenWorkflow(FOLLOW_DEFAULT, 'simple_publication_workflow')).toBe(
      'simple_publication_workflow',
    );
    expect(chosenWorkflow(NO_WORKFLOW, 'simple_publication_workflow')).toBe(
      null,
    );
    expect(chosenWorkflow('intranet_workflow', null)).toBe('intranet_workflow');
  });

  it('compares who sees the items before and after', () => {
    const [group] = preview.groups;
    // Drivers may send the states in another order.
    const reversed = { ...group, states: [...group.states].reverse() };
    const rows = mappingRows(reversed, preview.workflow, workflows, {
      published: 'internally_published',
    });
    expect(rows.map((row) => [row.id, row.target?.id, row.change])).toEqual([
      ['private', 'private', 0],
      ['pending', 'private', 0],
      ['published', 'internally_published', -1],
    ]);
    expect(
      mappingRows(group, null, workflows, {}).map((row) => row.target),
    ).toEqual([undefined, undefined, undefined]);
  });

  it('fills in the suggestions the editor kept', () => {
    expect(changedItems(preview)).toBe(3);
    expect(
      completeStateMap(preview, {
        simple_publication_workflow: { published: 'internally_published' },
      }),
    ).toEqual({
      simple_publication_workflow: {
        private: 'private',
        pending: 'private',
        published: 'internally_published',
      },
    });
  });

  it('finds the most visible state', () => {
    const [simple, intranet] = workflows;
    expect(mostVisible(simple.states)).toBe('anyone');
    expect(mostVisible(intranet.states.slice(0, 2))).toBe('members');
    expect(mostVisible([])).toBeUndefined();
  });
});
