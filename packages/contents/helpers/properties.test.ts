import { describe, expect, it } from 'vitest';
import {
  buildPropertiesPatch,
  cleanSentinelDate,
  computeInitialStates,
  fieldState,
} from './properties';

describe('cleanSentinelDate', () => {
  it('keeps a real date', () => {
    expect(cleanSentinelDate('2026-01-01T10:00:00+00:00')).toBe(
      '2026-01-01T10:00:00+00:00',
    );
  });

  it('treats far-past and far-future sentinels as empty', () => {
    expect(cleanSentinelDate('1969-12-31T00:00:00+00:00')).toBeNull();
    expect(cleanSentinelDate('2499-12-31T00:00:00+00:00')).toBeNull();
    expect(cleanSentinelDate('6767-12-31T01:00:00+00:00')).toBeNull();
  });

  it('treats empty, None and non-strings as empty', () => {
    expect(cleanSentinelDate('')).toBeNull();
    expect(cleanSentinelDate('None')).toBeNull();
    expect(cleanSentinelDate(null)).toBeNull();
  });
});

describe('fieldState', () => {
  it('reports a common value when all items agree', () => {
    expect(fieldState(['a', 'a'])).toEqual({ mixed: false, value: 'a' });
  });

  it('reports mixed when values differ', () => {
    expect(fieldState(['a', 'b'])).toEqual({ mixed: true, value: null });
  });

  it('treats null and undefined as the same empty value', () => {
    expect(fieldState([null, undefined])).toEqual({
      mixed: false,
      value: null,
    });
  });

  it('compares array values structurally', () => {
    expect(fieldState([['admin'], ['admin']])).toEqual({
      mixed: false,
      value: ['admin'],
    });
    expect(fieldState([['admin'], ['editor']])).toEqual({
      mixed: true,
      value: null,
    });
  });
});

describe('computeInitialStates', () => {
  it('computes per-field states for a mixed selection', () => {
    const states = computeInitialStates([
      { rights: 'CC', exclude_from_nav: true, creators: ['admin'] },
      { rights: 'CC', exclude_from_nav: false, creators: ['admin'] },
    ]);
    expect(states.rights).toEqual({ mixed: false, value: 'CC' });
    expect(states.exclude_from_nav).toEqual({ mixed: true, value: null });
    expect(states.creators).toEqual({ mixed: false, value: ['admin'] });
  });
});

describe('buildPropertiesPatch', () => {
  const baseForm = {
    effective: null as string | null,
    expires: null as string | null,
    rights: '',
    creators: '',
    exclude_from_nav: false,
  };

  it('returns nothing when the form matches the initial values', () => {
    const initial = computeInitialStates([
      {
        effective: '2026-01-01T10:00:00+00:00',
        rights: 'CC',
        creators: ['admin'],
        exclude_from_nav: false,
      },
    ]);
    const form = {
      ...baseForm,
      effective: '2026-01-01T10:00:00+00:00',
      rights: 'CC',
      creators: 'admin',
    };
    expect(buildPropertiesPatch(initial, form)).toEqual({});
  });

  it('does not resend a date that only changed format', () => {
    const initial = computeInitialStates([
      { effective: '2026-01-01T10:00:00+00:00' },
    ]);
    const form = { ...baseForm, effective: '2026-01-01T10:00:00.000Z' };
    expect(buildPropertiesPatch(initial, form)).toEqual({});
  });

  it('sends only the changed field', () => {
    const initial = computeInitialStates([
      { effective: '2026-01-01T10:00:00+00:00', rights: 'CC' },
    ]);
    const form = {
      ...baseForm,
      effective: '2026-01-01T10:00:00+00:00',
      rights: 'CC BY',
    };
    expect(buildPropertiesPatch(initial, form)).toEqual({ rights: 'CC BY' });
  });

  it('clears a date or rights value with null', () => {
    const initial = computeInitialStates([
      { effective: '2026-01-01T10:00:00+00:00', rights: 'CC' },
    ]);
    expect(buildPropertiesPatch(initial, baseForm)).toEqual({
      effective: null,
      rights: null,
    });
  });

  it('parses creators from the comma-separated input', () => {
    const initial = computeInitialStates([{ creators: ['admin'] }]);
    const form = { ...baseForm, creators: 'admin, editor' };
    expect(buildPropertiesPatch(initial, form)).toEqual({
      creators: ['admin', 'editor'],
    });
  });
});
