import { expect, describe, it, vi, afterEach } from 'vitest';
import { RouterContextProvider } from 'react-router';
import config from '@plone/registry';
import { cookie } from '@plone/react-router';
import {
  ploneClientContext,
  ploneContentContext,
  ploneSiteContext,
} from '@plone/aurora/app/middleware.server';
import { action, loader } from './login';

vi.mock('jwt-decode', () => ({
  jwtDecode: vi
    .fn()
    .mockReturnValue({ sub: 'admin', exp: 4102444800, fullname: null }),
}));

describe('Login route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    config.settings = {};
  });

  // A successful login posted to `url`, the way the login page's <Form> posts
  // (to the current URL, its query string included).
  const login = async (url: string) => {
    const loginMock = vi
      .fn()
      .mockResolvedValue({ data: { token: 'a.jwt.token' } });
    const context = new RouterContextProvider();
    context.set(ploneClientContext, { login: loginMock } as any);
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: 'admin', password: 'secret' }),
    });
    const result = await action({
      request,
      params: {},
      context,
      pattern: '/login',
      url: new URL(request.url),
    });
    return result as Response;
  };

  describe('action', () => {
    it('returns the editor to return_url after a successful login', async () => {
      const result = await login(
        'http://example.com/login?return_url=/en/press',
      );
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(302);
      expect(result.headers.get('Location')).toBe('/en/press');
      expect(result.headers.get('Set-Cookie')).toContain('auth_seven=');
    });

    it('reads return_url from a data request too', async () => {
      const result = await login(
        'http://example.com/login.data?return_url=/sv',
      );
      expect(result.headers.get('Location')).toBe('/sv');
    });

    it('returns to the site root when no return_url was sent', async () => {
      const result = await login('http://example.com/login');
      expect(result.status).toBe(302);
      expect(result.headers.get('Location')).toBe('/');
    });

    it('never leaves the site: an absolute return_url falls back to the site root', async () => {
      const result = await login(
        'http://example.com/login?return_url=https://evil.example/',
      );
      expect(result.headers.get('Location')).toBe('/');
    });

    it('never leaves the site: a protocol-relative return_url falls back to the site root', async () => {
      const result = await login(
        'http://example.com/login?return_url=//evil.example/',
      );
      expect(result.headers.get('Location')).toBe('/');
    });
  });

  describe('loader', () => {
    it('sends an already-logged-in visitor back to return_url', async () => {
      const request = new Request('http://example.com/login?return_url=/sv', {
        headers: { Cookie: await cookie.serialize('a.jwt.token') },
      });
      const context = new RouterContextProvider();
      context.set(ploneContentContext, {} as any);
      context.set(ploneSiteContext, {} as any);
      let location: string | null = 'NOT REDIRECTED';
      try {
        await loader({
          request,
          params: {},
          context,
          pattern: '/login',
          url: new URL(request.url),
        });
      } catch (thrown) {
        location = (thrown as Response).headers.get('Location');
      }
      expect(location).toBe('/sv');
    });
  });
});
