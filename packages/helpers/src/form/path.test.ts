import { describe, expect, it } from 'vitest';
import { getByPath, setByPath } from './path';

describe('getByPath', () => {
  it('reads nested object and array paths', () => {
    const source = { a: { b: [{ c: 1 }] } };
    expect(getByPath(source, 'a.b.0.c')).toBe(1);
  });

  it('returns undefined for missing parts', () => {
    expect(getByPath({ a: null }, 'a.b.c')).toBeUndefined();
    expect(getByPath(undefined, 'a')).toBeUndefined();
  });
});

describe('setByPath', () => {
  it('copies only the objects along the path', () => {
    const untouched = { keep: true };
    const source = { a: { b: 1 }, untouched };
    const next = setByPath(source, 'a.b', 2);

    expect(next).toEqual({ a: { b: 2 }, untouched });
    expect(next).not.toBe(source);
    expect(next.a).not.toBe(source.a);
    expect(next.untouched).toBe(untouched);
    expect(source.a.b).toBe(1);
  });

  it('creates missing objects and arrays', () => {
    expect(setByPath({}, 'items.0.label', 'First')).toEqual({
      items: [{ label: 'First' }],
    });
  });
});
