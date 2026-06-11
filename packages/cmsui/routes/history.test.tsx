import { expect, describe, it, vi, afterEach } from 'vitest';
import { RouterContextProvider } from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { action } from './history';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('token'),
}));

function buildArgs(body: Record<string, string>, revertMock: unknown) {
  const context = new RouterContextProvider();
  context.set(ploneClientContext, { revertHistory: revertMock } as never);
  context.set(ploneContentContext, { '@id': '/my-page' } as never);

  const formData = new FormData();
  for (const [key, value] of Object.entries(body)) {
    formData.append(key, value);
  }
  const request = new Request('http://example.com/@@history/my-page', {
    method: 'POST',
    body: formData,
  });

  return {
    request,
    params: {},
    context,
    unstable_pattern: '/@@history/*',
    unstable_url: new URL(request.url),
  };
}

describe('action', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reverts to the requested version', async () => {
    const revertMock = vi.fn().mockResolvedValue({});

    const result = await action(buildArgs({ version: '2' }, revertMock));

    expect(revertMock).toHaveBeenCalledWith({
      path: '/my-page',
      data: { version: 2 },
    });
    expect(result.data).toEqual({ ok: true });
  });

  it('rejects a missing version without calling the API', async () => {
    const revertMock = vi.fn();

    const result = await action(buildArgs({}, revertMock));

    expect(revertMock).not.toHaveBeenCalled();
    expect(result.data).toEqual({ ok: false, error: 'invalidVersion' });
    expect(result.init).toEqual({ status: 400 });
  });

  it('rejects a non-numeric version without calling the API', async () => {
    const revertMock = vi.fn();

    const result = await action(buildArgs({ version: 'abc' }, revertMock));

    expect(revertMock).not.toHaveBeenCalled();
    expect(result.data).toEqual({ ok: false, error: 'invalidVersion' });
    expect(result.init).toEqual({ status: 400 });
  });

  it('returns the failure as data when the revert call throws', async () => {
    const revertMock = vi.fn().mockRejectedValue(new Error('forbidden'));

    const result = await action(buildArgs({ version: '1' }, revertMock));

    expect(result.data).toEqual({ ok: false, error: 'revertFailed' });
    expect(result.init).toEqual({ status: 502 });
  });
});
