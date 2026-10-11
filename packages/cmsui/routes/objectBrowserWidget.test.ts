import { describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { loader } from './objectBrowserWidget';

const breadcrumbs = {
  '@id': '/news/@breadcrumbs',
  items: [{ '@id': '/news', title: 'News' }],
};

const run = async (search: ReturnType<typeof vi.fn>) => {
  const getBreadcrumbs = vi.fn();
  const context = new RouterContextProvider();
  context.set(ploneClientContext, { search, getBreadcrumbs } as any);
  // What the root middleware loads for the browsed folder.
  context.set(ploneContentContext, {
    '@id': '/news',
    '@components': { breadcrumbs },
  } as any);
  const request = new Request('http://localhost/@objectBrowserWidget/news');

  const result: any = await loader({
    request,
    params: { '*': 'news' },
    context,
    pattern: '/@objectBrowserWidget/*',
    url: new URL(request.url),
  } as any);
  return { result, getBreadcrumbs };
};

describe('objectBrowserWidget loader', () => {
  it('lists the folder, with the breadcrumbs the middleware loaded', async () => {
    const items = [{ '@id': '/news/one', title: 'One' }];
    const search = vi.fn().mockResolvedValue({ data: { items } });

    const { result, getBreadcrumbs } = await run(search);

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ path: { query: '/news' } }),
      }),
    );
    expect(result.data).toEqual({ results: { items }, breadcrumbs });
    // No second request for the breadcrumbs.
    expect(getBreadcrumbs).not.toHaveBeenCalled();
  });

  it('gives an empty listing for a search the API rejects', async () => {
    const search = vi.fn().mockRejectedValue({ status: 400 });

    const { result } = await run(search);

    expect(result.data.results.items).toEqual([]);
    expect(result.data.breadcrumbs).toEqual(breadcrumbs);
  });

  it('fails on server errors', async () => {
    const failure = { status: 500 };
    await expect(run(vi.fn().mockRejectedValue(failure))).rejects.toBe(failure);
  });
});
