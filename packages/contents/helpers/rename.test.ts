import { describe, expect, it } from 'vitest';
import { buildRenamePayload, type RenameEdit } from './rename';

const edit = (overrides: Partial<RenameEdit> = {}): RenameEdit => ({
  '@id': '/folder/doc',
  originalId: 'doc',
  originalTitle: 'Doc',
  id: 'doc',
  title: 'Doc',
  ...overrides,
});

describe('buildRenamePayload', () => {
  it('drops rows where nothing changed', () => {
    expect(buildRenamePayload([edit()])).toEqual([]);
  });

  it('includes only the changed title', () => {
    expect(buildRenamePayload([edit({ title: 'New title' })])).toEqual([
      {
        '@id': '/folder/doc',
        data: { title: 'New title' },
        title: 'New title',
      },
    ]);
  });

  it('includes only the changed id', () => {
    expect(buildRenamePayload([edit({ id: 'new-doc' })])).toEqual([
      { '@id': '/folder/doc', data: { id: 'new-doc' }, title: 'Doc' },
    ]);
  });

  it('includes both id and title when both changed', () => {
    expect(
      buildRenamePayload([edit({ id: 'new-doc', title: 'New title' })]),
    ).toEqual([
      {
        '@id': '/folder/doc',
        data: { id: 'new-doc', title: 'New title' },
        title: 'New title',
      },
    ]);
  });

  it('keeps only the rows that changed in a mixed selection', () => {
    const result = buildRenamePayload([
      edit({
        '@id': '/folder/a',
        originalId: 'a',
        id: 'a',
        originalTitle: 'A',
        title: 'A',
      }),
      edit({
        '@id': '/folder/b',
        originalId: 'b',
        id: 'b-renamed',
        originalTitle: 'B',
        title: 'B',
      }),
    ]);
    expect(result).toEqual([
      { '@id': '/folder/b', data: { id: 'b-renamed' }, title: 'B' },
    ]);
  });
});
