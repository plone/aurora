import { expect, describe, it, vi, afterEach, beforeEach } from 'vitest';
import config from '@plone/registry';
import { loader, action } from './controlpanelAddons';
import { RouterContextProvider } from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
}));

const apiPath = 'http://example.com/Plone';

const mockSiteAddons = {
  '@id': `${apiPath}/@addons`,
  items_total: 2,
  items: [
    {
      id: 'collective.installed',
      title: 'Installed Add-on',
      description: 'Already installed',
      version: '1.0.0',
      is_installed: true,
      upgrade_info: { available: false },
    },
    {
      id: 'collective.available',
      title: 'Available Add-on',
      description: 'Not yet installed',
      version: '2.0.0',
      is_installed: false,
      upgrade_info: {},
    },
  ],
};

const mockCatalogResponse = {
  query: '',
  kind: null,
  plone_version: '6.1.0',
  volto_version: '19',
  compatible: true,
  total: 1,
  b_start: 0,
  b_size: 24,
  count: 1,
  results: [
    {
      id: 'pypi:collective.catalog',
      name: 'collective.catalog',
      title: 'Catalog Add-on',
      summary: 'From the marketplace',
      kind: 'backend',
      source: 'pypi',
      latest_version: '3.0.0',
      trust: 'community',
      status: 'available',
      repo_url: 'https://example.com/repo',
      homepage: 'https://example.com',
      pairs_with: ['npm:@collective/catalog'],
    },
  ],
};

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    config: { apiPath, token: 'fake-token' },
    getAddons: vi.fn().mockResolvedValue({ data: mockSiteAddons }),
    ...overrides,
  } as any;
}

function makeContext(client: any) {
  const context = new RouterContextProvider();
  context.set(ploneClientContext, client);
  return context;
}

function callLoader(client: any, url: string) {
  const request = new Request(url);
  return loader({
    request,
    params: {},
    context: makeContext(client),
    unstable_pattern: '/controlpanel/addons',
    unstable_url: new URL(request.url),
  } as any);
}

describe('Addons control panel route', () => {
  beforeEach(() => {
    config.settings.apiPath = apiPath;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    config.settings = {};
  });

  describe('loader', () => {
    it('fetches site add-ons and queries the marketplace catalog endpoint', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockCatalogResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const client = makeClient();
      const result = await callLoader(
        client,
        'http://example.com/controlpanel/addons?q=catalog',
      );

      expect(client.getAddons).toHaveBeenCalledOnce();

      // The catalog request hits the @addon-marketplace-search endpoint with
      // the query and pagination params, plus the bearer token. Compatibility
      // filtering was removed, so the full catalog is always requested.
      expect(fetchMock).toHaveBeenCalledOnce();
      const [requestedUrl, requestInit] = fetchMock.mock.calls[0];
      expect(requestedUrl).toContain(`${apiPath}/@addon-marketplace-search?`);
      expect(requestedUrl).toContain('q=catalog');
      expect(requestedUrl).toContain('b_start=0');
      expect(requestedUrl).toContain('b_size=24');
      expect(requestedUrl).toContain('compatible=0');
      expect(requestInit.headers.Authorization).toBe('Bearer fake-token');

      expect(result.siteAddons).toEqual(mockSiteAddons.items);
      expect(result.query).toBe('catalog');
      expect(result.catalog).toHaveLength(1);
      expect(result.catalog[0].id).toBe('pypi:collective.catalog');
      expect(result.catalogTotal).toBe(1);
    });

    it('clamps a negative b_start to 0 and always requests the full catalog', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockCatalogResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      await callLoader(
        makeClient(),
        'http://example.com/controlpanel/addons?b_start=-5',
      );

      const [requestedUrl] = fetchMock.mock.calls[0];
      expect(requestedUrl).toContain('b_start=0');
      expect(requestedUrl).toContain('compatible=0');
      expect(requestedUrl).not.toContain('compatible=1');
    });

    it('falls back to the empty catalog when the endpoint responds non-ok', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response('nope', { status: 500 }));
      vi.stubGlobal('fetch', fetchMock);

      const result = await callLoader(
        makeClient(),
        'http://example.com/controlpanel/addons',
      );

      expect(result.catalog).toEqual([]);
      expect(result.catalogTotal).toBe(0);
      // Site add-ons are still returned independently of the catalog failure.
      expect(result.siteAddons).toEqual(mockSiteAddons.items);
    });

    it('falls back to the empty catalog when the response fails zod validation', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ totally: 'wrong shape' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const result = await callLoader(
        makeClient(),
        'http://example.com/controlpanel/addons',
      );

      expect(result.catalog).toEqual([]);
      expect(result.catalogTotal).toBe(0);
    });

    it('falls back to the empty catalog when fetch throws', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
      vi.stubGlobal('fetch', fetchMock);

      const result = await callLoader(
        makeClient(),
        'http://example.com/controlpanel/addons',
      );

      expect(result.catalog).toEqual([]);
      expect(result.catalogTotal).toBe(0);
    });
  });

  describe('action', () => {
    const runAction = (client: any, intent: string, id = 'collective.foo') => {
      const body = new URLSearchParams({ id, intent });
      const request = new Request('http://example.com/controlpanel/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      return action({
        request,
        params: {},
        context: makeContext(client),
        unstable_pattern: '/controlpanel/addons',
        unstable_url: new URL(request.url),
      } as any);
    };

    it('installs an add-on and returns ok on success', async () => {
      const installAddon = vi.fn().mockResolvedValue({});
      const result = await runAction(makeClient({ installAddon }), 'install');

      expect(installAddon).toHaveBeenCalledWith({ id: 'collective.foo' });
      expect(result).toEqual({ ok: true });
    });

    it('uninstalls an add-on and returns ok on success', async () => {
      const uninstallAddon = vi.fn().mockResolvedValue({});
      const result = await runAction(
        makeClient({ uninstallAddon }),
        'uninstall',
      );

      expect(uninstallAddon).toHaveBeenCalledWith({ id: 'collective.foo' });
      expect(result).toEqual({ ok: true });
    });

    it('upgrades an add-on and returns ok on success', async () => {
      const upgradeAddon = vi.fn().mockResolvedValue({});
      const result = await runAction(makeClient({ upgradeAddon }), 'upgrade');

      expect(upgradeAddon).toHaveBeenCalledWith({ id: 'collective.foo' });
      expect(result).toEqual({ ok: true });
    });

    it('returns ok:false with the error message when the client call throws', async () => {
      const installAddon = vi
        .fn()
        .mockRejectedValue(new Error('Server exploded'));
      const result = await runAction(makeClient({ installAddon }), 'install');

      expect(result).toEqual({ ok: false, error: 'Server exploded' });
    });

    it('returns ok:false for an unknown intent', async () => {
      const installAddon = vi.fn();
      const result = await runAction(
        makeClient({ installAddon }),
        'frobnicate',
      );

      expect(installAddon).not.toHaveBeenCalled();
      expect(result).toEqual({
        ok: false,
        error: 'Unknown intent: frobnicate',
      });
    });
  });

  describe('AddonsControlPanel component', () => {
    const loaderData = {
      siteAddons: mockSiteAddons.items,
      query: '',
      catalog: mockCatalogResponse.results,
      catalogTotal: 1,
      catalogStart: 0,
      catalogSize: 24,
    };

    afterEach(() => {
      vi.resetModules();
    });

    // Re-import the route with react-router hooks, Pluggable and auth mocked so
    // the default component can render in isolation (no router/provider tree).
    const renderPanel = async (fetcherData?: unknown, data = loaderData) => {
      vi.resetModules();

      vi.doMock('@plone/react-router', () => ({
        requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
      }));

      vi.doMock('@plone/layout/components/Pluggable', () => ({
        Plug: ({ children }: { children: any }) => <>{children}</>,
      }));

      // The `?react` SVG imports resolve to a data-URI string under vitest
      // (no SVGR transform); stub them with a real component so render works.
      const svgStub = (props: any) => <svg {...props} />;
      vi.doMock('@plone/components/icons/arrow-left.svg?react', () => ({
        default: svgStub,
      }));
      vi.doMock('@plone/components/icons/chevron-down.svg?react', () => ({
        default: svgStub,
      }));

      vi.doMock('react-router', async (importOriginal) => {
        const actual = (await importOriginal()) as any;
        return {
          ...actual,
          useLoaderData: () => data,
          useNavigate: () => vi.fn(),
          useNavigation: () => ({ state: 'idle', location: null }),
          useSearchParams: () => [new URLSearchParams(), vi.fn()],
          useFetcher: () => ({
            state: 'idle',
            data: fetcherData,
            submit: vi.fn(),
            Form: (props: any) => <form {...props} />,
          }),
        };
      });

      const { render, screen } = await import('@testing-library/react');
      const { default: AddonsControlPanel } = await import(
        './controlpanelAddons'
      );

      render(<AddonsControlPanel />);
      return screen;
    };

    it('groups installed/available site add-ons and renders the catalog', async () => {
      const screen = await renderPanel();

      // Section headings (i18n falls back to the raw key in tests).
      expect(
        screen.getByRole('heading', { name: 'cmsui.addons.installed' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'cmsui.addons.available' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'cmsui.addons.catalog' }),
      ).toBeInTheDocument();

      // Items from each source render.
      expect(screen.getByText('Installed Add-on')).toBeInTheDocument();
      expect(screen.getByText('Available Add-on')).toBeInTheDocument();
      expect(screen.getByText('Catalog Add-on')).toBeInTheDocument();
    });

    it('shows the action error alert when fetcher.data.ok is false', async () => {
      const screen = await renderPanel({ ok: false, error: 'boom' });

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
      // Site-add-on action errors surface the actionError message; locate it by text.
      const actionAlert = alerts.find((alert) =>
        alert.textContent?.includes('cmsui.addons.actionError'),
      );
      expect(actionAlert).toBeDefined();
      // Raw error detail is surfaced via the title attribute.
      expect(actionAlert).toHaveAttribute('title', 'boom');
    });

    it('shows the empty message when there are no add-ons at all', async () => {
      const screen = await renderPanel(undefined, {
        ...loaderData,
        siteAddons: [],
        catalog: [],
        catalogTotal: 0,
      });

      expect(screen.getByText('cmsui.addons.empty')).toBeInTheDocument();
    });
  });
});
