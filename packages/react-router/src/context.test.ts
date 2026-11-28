import { describe, expect, it } from 'vitest';
import { RouterContextProvider } from 'react-router';
import {
  ploneClearAuthCookieContext,
  ploneLocaleContext,
  ploneUserContext,
} from './context';

describe('context', () => {
  it('defaults to an anonymous user and keeping the auth cookie', () => {
    const context = new RouterContextProvider();

    expect(context.get(ploneUserContext)).toBeNull();
    expect(context.get(ploneClearAuthCookieContext)).toBe(false);
  });

  it('returns the locale the app set', () => {
    const context = new RouterContextProvider();
    context.set(ploneLocaleContext, 'de');

    expect(context.get(ploneLocaleContext)).toBe('de');
  });
});
