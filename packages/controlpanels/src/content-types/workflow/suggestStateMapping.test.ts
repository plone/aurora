import { workflows } from '../mock/fixtures/workflows';
import { compareVisibility, suggestStateMapping } from './suggestStateMapping';

const workflow = (id: string) => workflows.find((entry) => entry.id === id)!;

describe('suggestStateMapping', () => {
  it('keeps the same state when the workflow keeps it', () => {
    const simple = workflow('simple_publication_workflow');
    expect(suggestStateMapping(simple, simple)).toEqual({
      private: 'private',
      pending: 'pending',
      published: 'published',
    });
  });

  it("doesn't unpublish items when the same id would hide them", () => {
    // The classic panel maps Published to the first state, Internal draft.
    expect(
      suggestStateMapping(
        workflow('simple_publication_workflow'),
        workflow('intranet_workflow'),
      ),
    ).toEqual({
      private: 'private',
      pending: 'private',
      published: 'external',
    });
  });

  it('never shows items to more people', () => {
    expect(
      suggestStateMapping(
        workflow('intranet_workflow'),
        workflow('simple_publication_workflow'),
      ),
    ).toEqual({
      internal: 'private',
      pending: 'pending',
      internally_published: 'private',
      external: 'published',
      private: 'private',
    });
  });

  it('falls back to the least visible state', () => {
    expect(
      suggestStateMapping(
        workflow('simple_publication_workflow'),
        workflow('one_state_workflow'),
      ),
    ).toEqual({
      private: 'published',
      pending: 'published',
      published: 'published',
    });
  });
});

describe('compareVisibility', () => {
  it('says whether a state shows an item to fewer or more people', () => {
    expect(compareVisibility('anyone', 'members')).toBeLessThan(0);
    expect(compareVisibility('restricted', 'anyone')).toBeGreaterThan(0);
    expect(compareVisibility('members', 'members')).toBe(0);
  });
});
