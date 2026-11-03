import { describe, expect, it } from 'vitest';
import { applyTagChanges, buildTagsPayload, unionSubjects } from './tags';

describe('unionSubjects', () => {
  it('collects, de-duplicates and sorts tags across items', () => {
    const items = [
      { '@id': '/a', subjects: ['news', 'event'] },
      { '@id': '/b', subjects: ['event', 'press'] },
      { '@id': '/c', subjects: null },
    ];
    expect(unionSubjects(items)).toEqual(['event', 'news', 'press']);
  });

  it('reads the brain `Subject` field when present', () => {
    const items = [
      { '@id': '/a', Subject: ['news'] },
      { '@id': '/b', Subject: ['event'] },
    ];
    expect(unionSubjects(items)).toEqual(['event', 'news']);
  });
});

describe('applyTagChanges', () => {
  it('adds and removes without duplicating', () => {
    expect(applyTagChanges(['news'], ['news', 'event'], ['old'])).toEqual([
      'news',
      'event',
    ]);
  });

  it('treats missing current subjects as empty', () => {
    expect(applyTagChanges(null, ['news'], [])).toEqual(['news']);
  });

  it('removes a tag', () => {
    expect(applyTagChanges(['news', 'event'], [], ['event'])).toEqual(['news']);
  });
});

describe('buildTagsPayload', () => {
  it('keeps only items whose subjects change', () => {
    const items = [
      { '@id': '/a', title: 'A', subjects: ['news'] },
      { '@id': '/b', title: 'B', subjects: ['news', 'event'] },
    ];
    const result = buildTagsPayload(items, ['news'], ['event']);
    expect(result).toEqual([
      { '@id': '/b', title: 'B', data: { subjects: ['news'] } },
    ]);
  });

  it('returns nothing when there are no changes', () => {
    const items = [{ '@id': '/a', title: 'A', subjects: ['news'] }];
    expect(buildTagsPayload(items, [], [])).toEqual([]);
  });
});
