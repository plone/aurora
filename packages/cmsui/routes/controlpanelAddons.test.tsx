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
    it('returns the site add-ons from getAddons', async () => {
      const client = makeClient();
      const result = await callLoader(
        client,
        'http://example.com/controlpanel/addons',
      );

      expect(client.getAddons).toHaveBeenCalledOnce();
      expect(result.siteAddons).toEqual(mockSiteAddons.items);
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
    const loaderData = { siteAddons: mockSiteAddons.items };

    afterEach(() => {
      vi.resetModules();
    });

    const renderPanel = async (fetcherData?: unknown, data = loaderData) => {
      vi.resetModules();
      document.body.innerHTML = '';

      vi.doMock('@plone/react-router', () => ({
        requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
      }));

      vi.doMock('@plone/layout/components/Pluggable', () => ({
        Plug: ({ children }: { children: any }) => <>{children}</>,
      }));

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

      const result = render(<AddonsControlPanel />);
      return { screen, ...result };
    };

    it('groups installed and available site add-ons', async () => {
      const { screen } = await renderPanel();

      expect(
        screen.getByRole('heading', { name: 'cmsui.addons.installed' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'cmsui.addons.available' }),
      ).toBeInTheDocument();

      expect(screen.getByText('Installed Add-on')).toBeInTheDocument();
      expect(screen.getByText('Available Add-on')).toBeInTheDocument();
    });

    it('filters the list as you type in the search box', async () => {
      const { screen } = await renderPanel();
      const { fireEvent } = await import('@testing-library/react');

      expect(screen.getByText('Installed Add-on')).toBeInTheDocument();

      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'Available' },
      });

      expect(screen.getByText('Available Add-on')).toBeInTheDocument();
      expect(screen.queryByText('Installed Add-on')).not.toBeInTheDocument();
    });

    it('shows the action error alert when fetcher.data.ok is false', async () => {
      const { screen } = await renderPanel({ ok: false, error: 'boom' });

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
      const actionAlert = alerts.find((alert) =>
        alert.textContent?.includes('cmsui.addons.actionError'),
      );
      expect(actionAlert).toBeDefined();
      expect(actionAlert).toHaveAttribute('title', 'boom');
    });

    it('shows the empty message when there are no add-ons', async () => {
      const { screen } = await renderPanel(undefined, { siteAddons: [] });

      expect(screen.getByText('cmsui.addons.empty')).toBeInTheDocument();
    });
  });
});
