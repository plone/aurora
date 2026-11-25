import { describe, expect, it } from 'vitest';
import { redact, REDACTED } from './redact';

describe('redact', () => {
  it('redacts secret-looking keys at any depth', () => {
    expect(
      redact({
        login: 'admin',
        password: 'secret',
        nested: {
          token: 'jwt',
          Authorization: 'Bearer x',
          items: [{ new_password: 'p' }],
        },
      }),
    ).toEqual({
      login: 'admin',
      password: REDACTED,
      nested: {
        token: REDACTED,
        Authorization: REDACTED,
        items: [{ new_password: REDACTED }],
      },
    });
  });

  it('keeps empty and null secrets visible, and other values untouched', () => {
    expect(redact({ password: '', token: null, title: 'Passwords' })).toEqual({
      password: '',
      token: null,
      title: 'Passwords',
    });
  });

  it('returns primitives as they are', () => {
    expect(redact('text')).toBe('text');
    expect(redact(3)).toBe(3);
    expect(redact(null)).toBe(null);
  });
});
