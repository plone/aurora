import { describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { loader } from './objectBrowserWidget';

const breadcrumbs = {
  '@id': '/news/@breadcrumbs',
  items: [{ '@id': '/news', title: 'News' }],
};

const run = async (
  search: ReturnType<typeof vi.fn>,
  getBreadcrumbs = vi.fn().mockResolvedValue({ data: breadcrumbs }),
) => {
  // The root middleware doesn't load the content for this resource route,
  // so only the client is in the context.
  const context = new RouterContextProvider();
  context.set(ploneClientContext, { search, getBreadcrumbs } as any);
  const request = new Request('http://localhost/@objectBrowserWidget/news');

  const result: any = await loader({
    request,
    params: { '*': 'news' },
    context,
    pattern: '@objectBrowserWidget/*',
    url: new URL(request.url),
  } as any);
  return { result, getBreadcrumbs };
};

describe('objectBrowserWidget loader', () => {
  it('lists the folder, with its breadcrumbs', async () => {
    const items = [{ '@id': '/news/one', title: 'One' }];
    const search = vi.fn().mockResolvedValue({ data: { items } });

    const { result, getBreadcrumbs } = await run(search);

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ path: { query: '/news' } }),
      }),
    );
    expect(result.data).toEqual({ results: { items }, breadcrumbs });
    expect(getBreadcrumbs).toHaveBeenCalledWith({ path: '/news' });
  });

  it('gives an empty listing for a search the API rejects', async () => {
    const search = vi.fn().mockRejectedValue({ status: 400 });

    const { result } = await run(search);

    expect(result.data.results.items).toEqual([]);
    expect(result.data.breadcrumbs).toEqual(breadcrumbs);
  });

  it('gives an empty listing for a folder that does not exist', async () => {
    const notFound = { status: 404 };

    const { result } = await run(
      vi.fn().mockRejectedValue(notFound),
      vi.fn().mockRejectedValue(notFound),
    );

    expect(result.data).toEqual({
      results: { '@id': '', items: [], items_total: 0 },
      breadcrumbs: { '@id': '', items: [] },
    });
  });

  it('fails on server errors', async () => {
    const failure = { status: 500 };
    await expect(run(vi.fn().mockRejectedValue(failure))).rejects.toBe(failure);
  });
});
