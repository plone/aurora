import { describe, expect, it } from 'vitest';
import { commonTransitions, transitionId } from './workflow';

const transition = (id: string, title = id) => ({
  '@id': `http://site/doc/@workflow/${id}`,
  title,
});

describe('transitionId', () => {
  it('extracts the last path segment', () => {
    expect(transitionId(transition('publish'))).toBe('publish');
  });
});

describe('commonTransitions', () => {
  it('returns the intersection across items', () => {
    const result = commonTransitions([
      [transition('publish', 'Publish'), transition('submit', 'Submit')],
      [transition('publish', 'Publish'), transition('retract', 'Retract')],
    ]);
    expect(result).toEqual([{ id: 'publish', title: 'Publish' }]);
  });

  it('returns all transitions for a single item', () => {
    const result = commonTransitions([
      [transition('publish', 'Publish'), transition('submit', 'Submit')],
    ]);
    expect(result).toEqual([
      { id: 'publish', title: 'Publish' },
      { id: 'submit', title: 'Submit' },
    ]);
  });

  it('returns empty when items share no transition', () => {
    const result = commonTransitions([
      [transition('publish')],
      [transition('retract')],
    ]);
    expect(result).toEqual([]);
  });

  it('returns empty for an empty selection', () => {
    expect(commonTransitions([])).toEqual([]);
  });
});
