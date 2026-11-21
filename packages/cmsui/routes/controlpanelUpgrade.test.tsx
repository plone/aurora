import { expect, describe, it, vi, afterEach } from 'vitest';
import { loader, action } from './controlpanelUpgrade';
import { RouterContextProvider } from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
}));

const apiPath = 'http://example.com/Plone';

const upgradeInfo = {
  '@id': `${apiPath}/@upgrade`,
  upgrade_steps: {
    '6205-6206': [{ id: 'step-1', title: 'Update the catalog' }],
  },
  versions: { fs: '6206', instance: '6205' },
};

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    config: { apiPath, token: 'fake-token' },
    getUpgrade: vi.fn().mockResolvedValue({ data: upgradeInfo }),
    ...overrides,
  } as any;
}

function makeContext(client: any) {
  const context = new RouterContextProvider();
  context.set(ploneClientContext, client);
  return context;
}

const url = 'http://example.com/@@controlpanel/plone-upgrade';

const runAction = (client: any, dryRun?: boolean) => {
  const body = new URLSearchParams(
    dryRun === undefined ? {} : { dry_run: String(dryRun) },
  );
  const request = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return action({
    request,
    params: {},
    context: makeContext(client),
    unstable_pattern: '/@@controlpanel/plone-upgrade',
    unstable_url: new URL(request.url),
  } as any);
};

describe('Plone upgrade control panel route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the upgrade information from @upgrade', async () => {
    const client = makeClient();
    const request = new Request(url);
    const result = await loader({
      request,
      params: {},
      context: makeContext(client),
      unstable_pattern: '/@@controlpanel/plone-upgrade',
      unstable_url: new URL(request.url),
    } as any);

    expect(client.getUpgrade).toHaveBeenCalledOnce();
    expect(result.upgrade).toEqual(upgradeInfo);
  });

  it('runs the upgrade and returns its report', async () => {
    const runUpgrade = vi.fn().mockResolvedValue({
      data: { dry_run: false, report: 'Done', upgraded: true },
    });
    const result = await runAction(makeClient({ runUpgrade }), false);

    expect(runUpgrade).toHaveBeenCalledWith({ data: { dry_run: false } });
    expect(result).toEqual({ ok: true, dry_run: false, report: 'Done' });
  });

  it('runs a dry run when asked', async () => {
    const runUpgrade = vi.fn().mockResolvedValue({
      data: { dry_run: true, report: 'Dry run', upgraded: false },
    });
    const result = await runAction(makeClient({ runUpgrade }), true);

    expect(runUpgrade).toHaveBeenCalledWith({ data: { dry_run: true } });
    expect(result).toEqual({ ok: true, dry_run: true, report: 'Dry run' });
  });

  it('returns the error when the upgrade fails', async () => {
    const runUpgrade = vi.fn().mockRejectedValue(new Error('Server exploded'));
    const result = await runAction(makeClient({ runUpgrade }), false);

    expect(result).toEqual({ ok: false, error: 'Server exploded' });
  });
});
