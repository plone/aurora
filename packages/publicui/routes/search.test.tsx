import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import config from '@plone/registry';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { loader } from './search';

const makeArgs = (
  urlString: string,
  cli: unknown,
  params: Record<string, string> = {},
) => {
  const context = new RouterContextProvider();
  context.set(ploneClientContext, cli as never);
  const request = new Request(urlString);
  return {
    request,
    context,
    params,
    unstable_pattern: '/search',
    unstable_url: new URL(urlString),
  } as never;
};

describe('Search loader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    config.settings = {} as never;
  });

  it('short-circuits on an empty term without querying the backend', async () => {
    const cli = { search: vi.fn() };
    const result = await loader(makeArgs('http://example.com/search', cli));
    expect(cli.search).not.toHaveBeenCalled();
    expect(result).toMatchObject({ search: [], total: 0, facets: [] });
  });

  it('short-circuits on a whitespace-only term', async () => {
    const cli = { search: vi.fn() };
    const result = await loader(
      makeArgs('http://example.com/search?SearchableText=%20%20', cli),
    );
    expect(cli.search).not.toHaveBeenCalled();
    expect(result).toMatchObject({ search: [], total: 0 });
  });

  it('queries the page and the facet sample, returns flattened data', async () => {
    config.settings = { apiPath: 'http://example.com' } as never;
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            items: [{ '@id': 'http://example.com/a', title: 'A' }],
            items_total: 1,
          },
        })
        .mockResolvedValueOnce({
          data: { items: [{ Subject: ['x'] }, { Subject: ['x', 'y'] }] },
        }),
    };

    const result = await loader(
      makeArgs('http://example.com/search?SearchableText=foo', cli),
    );

    expect(cli.search).toHaveBeenCalledTimes(2);
    expect(cli.search.mock.calls[0][0].query).toMatchObject({
      SearchableText: 'foo*',
      use_site_search_settings: 1,
      b_start: 0,
    });
    expect(cli.search.mock.calls[1][0].query).toMatchObject({
      metadata_fields: 'Subject',
    });
    expect((result as { search: { '@id': string }[] }).search[0]['@id']).toBe(
      '/a',
    );
    expect(result).toMatchObject({
      total: 1,
      facets: [
        { subject: 'x', count: 2 },
        { subject: 'y', count: 1 },
      ],
    });
  });

  it('scopes the query to the root segment on the scoped route', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 0 } })
        .mockResolvedValueOnce({ data: { items: [] } }),
    };

    await loader(
      makeArgs('http://example.com/en/search?SearchableText=foo', cli, {
        root: 'en',
      }),
    );

    expect(cli.search.mock.calls[0][0].query.path).toEqual({ query: '/en' });
    expect(cli.search.mock.calls[1][0].query.path).toEqual({ query: '/en' });
  });

  it('does not scope the global route', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 0 } })
        .mockResolvedValueOnce({ data: { items: [] } }),
    };

    await loader(makeArgs('http://example.com/search?SearchableText=foo', cli));

    expect(cli.search.mock.calls[0][0].query.path).toBeUndefined();
  });

  it('redirects a b_start beyond the last page to the last page', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 30 } })
        .mockResolvedValueOnce({ data: { items: [] } }),
    };

    await expect(
      loader(
        makeArgs(
          'http://example.com/search?SearchableText=foo&b_start=500',
          cli,
        ),
      ),
    ).rejects.toSatisfy((thrown: unknown) => {
      const response = thrown as Response;
      return (
        response instanceof Response &&
        response.status === 302 &&
        (response.headers.get('Location') ?? '').includes('b_start=25')
      );
    });
  });

  it('drops b_start entirely when the last page is the first', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 3 } })
        .mockResolvedValueOnce({ data: { items: [] } }),
    };

    await expect(
      loader(
        makeArgs(
          'http://example.com/search?SearchableText=foo&b_start=500',
          cli,
        ),
      ),
    ).rejects.toSatisfy((thrown: unknown) => {
      const response = thrown as Response;
      return (
        response instanceof Response &&
        !(response.headers.get('Location') ?? '').includes('b_start')
      );
    });
  });

  it('maps backend failures to a thrown error response', async () => {
    const cli = {
      search: vi.fn().mockRejectedValue({ status: 503, data: {} }),
    };

    await expect(
      loader(makeArgs('http://example.com/search?SearchableText=foo', cli)),
    ).rejects.toMatchObject({ init: { status: 503 } });
  });
});
