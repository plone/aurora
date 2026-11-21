import { describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import {
  cookie,
  localeCookie,
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
      { children: undefined, file: './login.tsx', path: '/login', id: 'login' },
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
        id: '@plone/components/login',
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
        id: 'login',
        children: [
          {
            children: undefined,
            file: './login/ok.tsx',
            path: '/login/ok',
            id: 'login/ok',
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
        id: 'index',
      },
      {
        children: undefined,
        path: 'edit/*',
        file: './edit.tsx',
        id: 'edit',
      },
    ]);
  });
});

describe('getAddonRoutesConfig: add-ons and ids', () => {
  const addonsInfo = [
    { name: '@plone/cmsui', modulePath: '/repo/packages/cmsui' },
    { name: '@plone/cmsui-extra', modulePath: '/repo/packages/cmsui-extra' },
  ];

  it('resolves a file of an add-on whose name starts like another one', () => {
    const [entry] = getAddonRoutesConfig(
      [
        {
          type: 'route',
          path: 'extra',
          file: '@plone/cmsui-extra/routes/extra.tsx',
        },
      ],
      addonsInfo,
    );
    expect(entry.file).toBe('/repo/packages/cmsui-extra/routes/extra.tsx');
    expect(entry.id).toBe('@plone/cmsui-extra/routes/extra');
  });

  it('gives layouts and index routes their registry id', () => {
    const [layoutEntry] = getAddonRoutesConfig(
      [
        {
          type: 'layout',
          file: '@plone/cmsui/routes/layout.tsx',
          children: [{ type: 'index', file: '@plone/cmsui/routes/home.tsx' }],
        },
      ],
      addonsInfo,
    );
    expect(layoutEntry.id).toBe('@plone/cmsui/routes/layout');
    expect(layoutEntry.children?.[0].id).toBe('@plone/cmsui/routes/home');
  });

  it('keeps an explicit id', () => {
    const [entry] = getAddonRoutesConfig(
      [
        {
          type: 'index',
          file: '@plone/cmsui/routes/home.tsx',
          options: { id: 'home' },
        },
      ],
      addonsInfo,
    );
    expect(entry.id).toBe('home');
  });

  it('does not change the routes it is given', () => {
    const routes: Array<ReactRouterRouteEntry> = [
      { type: 'route', path: 'edit', file: '@plone/cmsui/routes/edit.tsx' },
    ];
    const before = JSON.stringify(routes);
    getAddonRoutesConfig(routes, addonsInfo);
    expect(JSON.stringify(routes)).toBe(before);
  });

  it('warns when two routes match the same URL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getAddonRoutesConfig(
      [
        { type: 'route', path: 'login', file: '@plone/cmsui/routes/login.tsx' },
        {
          type: 'layout',
          file: '@plone/cmsui-extra/routes/layout.tsx',
          children: [
            {
              type: 'route',
              path: 'login',
              file: '@plone/cmsui-extra/routes/login.tsx',
            },
          ],
        },
      ],
      addonsInfo,
    );
    expect(warn).toHaveBeenCalledWith(
      '[@plone/react-router] The routes "@plone/cmsui/routes/login" and "@plone/cmsui-extra/routes/login" both match /login.',
    );
    warn.mockRestore();
  });

  it('does not warn about an index route and its parent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getAddonRoutesConfig(
      [
        {
          type: 'prefix',
          path: 'passwordreset',
          children: [
            {
              type: 'index',
              file: '@plone/cmsui/routes/reset.tsx',
              options: { id: 'a' },
            },
            {
              type: 'route',
              path: ':token',
              file: '@plone/cmsui/routes/reset.tsx',
              options: { id: 'b' },
            },
          ],
        },
      ],
      addonsInfo,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
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

describe('localeCookie', () => {
  it('persists the language with the same settings used by the preferences page', async () => {
    const header = await localeCookie.serialize('en');
    expect(header).toContain('aurora_language=');
    expect(header).toContain('Path=/');
    expect(header).toContain('Max-Age=31536000');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(await localeCookie.parse(header)).toBe('en');
  });
});
