import { describe, expect, it } from 'vitest';
import { RouterContextProvider } from 'react-router';
import {
  cookie,
  getAddonRoutesConfig,
  getReturnUrl,
  redirectIfLoggedInLoader,
} from './index';
import type { ReactRouterRouteEntry } from '@plone/types';

describe('getAddonRoutesConfig', () => {
  const addonsInfo = [
    {
      name: '@plone/components',
      modulePath: '/my/path/to/plone/components',
    },
  ];

  it('route - basic', () => {
    const routesConfig: Array<ReactRouterRouteEntry> = [
      {
        type: 'route',
        path: '/login',
        file: './login.tsx',
      },
    ];
    expect(getAddonRoutesConfig(routesConfig, addonsInfo)).toEqual([
      { children: undefined, file: './login.tsx', path: '/login' },
    ]);
  });

  it('route - basic with addon name', () => {
    const routesConfig: Array<ReactRouterRouteEntry> = [
      {
        type: 'route',
        path: '/login',
        file: '@plone/components/login.tsx',
      },
    ];
    expect(getAddonRoutesConfig(routesConfig, addonsInfo)).toEqual([
      {
        children: undefined,
        file: '/my/path/to/plone/components/login.tsx',
        path: '/login',
      },
    ]);
  });

  it('route - with options', () => {
    const routesConfig: Array<ReactRouterRouteEntry> = [
      {
        type: 'route',
        path: '/login',
        file: './login.tsx',
        options: {
          id: 'login',
        },
      },
    ];
    expect(getAddonRoutesConfig(routesConfig, addonsInfo)).toEqual([
      {
        children: undefined,
        file: './login.tsx',
        path: '/login',
        id: 'login',
      },
    ]);
  });

  it('route - nested', () => {
    const routesConfig: Array<ReactRouterRouteEntry> = [
      {
        type: 'route',
        path: '/login',
        file: './login.tsx',
        children: [
          {
            type: 'route',
            path: '/login/ok',
            file: './login/ok.tsx',
          },
        ],
      },
    ];
    expect(getAddonRoutesConfig(routesConfig, addonsInfo)).toEqual([
      {
        file: './login.tsx',
        path: '/login',
        children: [
          {
            children: undefined,
            file: './login/ok.tsx',
            path: '/login/ok',
          },
        ],
      },
    ]);
  });

  it('route - prefix', () => {
    const routesConfig: Array<ReactRouterRouteEntry> = [
      {
        type: 'prefix',
        path: 'edit',
        children: [
          {
            type: 'index',
            file: './index.tsx',
          },
          {
            type: 'route',
            path: '*',
            file: './edit.tsx',
          },
        ],
      },
    ];
    expect(getAddonRoutesConfig(routesConfig, addonsInfo)).toEqual([
      {
        children: undefined,
        path: 'edit',
        file: './index.tsx',
        index: true,
      },
      {
        children: undefined,
        path: 'edit/*',
        file: './edit.tsx',
      },
    ]);
  });
});

describe('getReturnUrl', () => {
  const at = (url: string) => getReturnUrl(new Request(url));

  it('returns a same-origin return_url', () => {
    expect(at('http://example.com/login?return_url=/en/press')).toBe(
      '/en/press',
    );
  });

  it('keeps the query and fragment of return_url', () => {
    expect(
      at('http://example.com/login?return_url=%2Fen%2Fpress%3Fpage%3D2%23top'),
    ).toBe('/en/press?page=2#top');
  });

  it('reads return_url from a data request too', () => {
    expect(at('http://example.com/login.data?return_url=/sv')).toBe('/sv');
  });

  it('falls back to the site root without return_url', () => {
    expect(at('http://example.com/login')).toBe('/');
  });

  it("falls back to the caller's fallback", () => {
    expect(getReturnUrl(new Request('http://example.com/login'), '/en')).toBe(
      '/en',
    );
  });

  it('falls back on an empty return_url', () => {
    expect(at('http://example.com/login?return_url=')).toBe('/');
  });

  it('refuses an absolute URL', () => {
    expect(
      at('http://example.com/login?return_url=https://evil.example/'),
    ).toBe('/');
  });

  it('refuses a protocol-relative URL', () => {
    expect(at('http://example.com/login?return_url=//evil.example/')).toBe('/');
  });

  it('refuses a backslash path', () => {
    expect(at('http://example.com/login?return_url=/%5Cevil.example')).toBe(
      '/',
    );
  });

  it('refuses a return_url carrying a line break', () => {
    expect(
      at('http://example.com/login?return_url=/en%0D%0ASet-Cookie:x=y'),
    ).toBe('/');
  });

  it('refuses a return_url a browser would read as another host once it strips a tab', () => {
    expect(at('http://example.com/login?return_url=/%09/evil.example')).toBe(
      '/',
    );
  });

  it('refuses a backslash path a browser would read as another host once it strips a tab', () => {
    expect(at('http://example.com/login?return_url=/%09%5Cevil.example')).toBe(
      '/',
    );
  });

  it('refuses a return_url the URL parser resolves to another host', () => {
    expect(at('http://example.com/login?return_url=/%5C/evil.example')).toBe(
      '/',
    );
  });
});

describe('redirectIfLoggedInLoader', () => {
  const loggedInRequest = async (url: string) =>
    new Request(url, {
      headers: { Cookie: await cookie.serialize('a.jwt.token') },
    });

  // The loader throws its redirect; return the Location it carried, or the
  // marker when it let the request through.
  const redirectLocation = async (request: Request) => {
    try {
      await redirectIfLoggedInLoader({
        request,
        params: {},
        context: new RouterContextProvider(),
      });
    } catch (thrown) {
      return (thrown as Response).headers.get('Location');
    }
    return 'NOT REDIRECTED';
  };

  it('sends an already-logged-in visitor back to return_url', async () => {
    expect(
      await redirectLocation(
        await loggedInRequest('http://example.com/login?return_url=/sv'),
      ),
    ).toBe('/sv');
  });

  it('keeps the query and fragment of return_url', async () => {
    expect(
      await redirectLocation(
        await loggedInRequest(
          'http://example.com/login?return_url=%2Fen%2Fpress%3Fpage%3D2%23top',
        ),
      ),
    ).toBe('/en/press?page=2#top');
  });

  it('falls back to the site root when no return_url was sent', async () => {
    expect(
      await redirectLocation(await loggedInRequest('http://example.com/login')),
    ).toBe('/');
  });

  it('never leaves the site: an absolute return_url falls back to the site root', async () => {
    expect(
      await redirectLocation(
        await loggedInRequest(
          'http://example.com/login?return_url=https://evil.example/',
        ),
      ),
    ).toBe('/');
  });

  it('never leaves the site: a protocol-relative return_url falls back to the site root', async () => {
    expect(
      await redirectLocation(
        await loggedInRequest(
          'http://example.com/login?return_url=//evil.example/',
        ),
      ),
    ).toBe('/');
  });

  it('never leaves the site: a backslash return_url falls back to the site root', async () => {
    expect(
      await redirectLocation(
        await loggedInRequest(
          'http://example.com/login?return_url=/%5Cevil.example',
        ),
      ),
    ).toBe('/');
  });

  it('lets a visitor without a cookie through', async () => {
    expect(
      await redirectLocation(
        new Request('http://example.com/login?return_url=/sv'),
      ),
    ).toBe('NOT REDIRECTED');
  });
});
