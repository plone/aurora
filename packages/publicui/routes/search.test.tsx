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

  it('searches everything on an empty term, omitting SearchableText', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 5 } }),
    };
    const result = await loader(makeArgs('http://example.com/search', cli));
    expect(cli.search).toHaveBeenCalledTimes(1);
    expect(cli.search.mock.calls[0][0].query).not.toHaveProperty(
      'SearchableText',
    );
    expect(cli.search.mock.calls[0][0].query).toMatchObject({
      use_site_search_settings: 1,
    });
    expect(result).toMatchObject({ total: 5, params: '' });
  });

  it('treats a whitespace-only term as empty', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 5 } }),
    };
    await loader(
      makeArgs('http://example.com/search?SearchableText=%20%20', cli),
    );
    expect(cli.search.mock.calls[0][0].query).not.toHaveProperty(
      'SearchableText',
    );
  });

  it('queries one page of results and returns flattened data', async () => {
    config.settings = { apiPath: 'http://example.com' } as never;
    const cli = {
      search: vi.fn().mockResolvedValueOnce({
        data: {
          items: [{ '@id': 'http://example.com/a', title: 'A' }],
          items_total: 1,
        },
      }),
    };

    const result = await loader(
      makeArgs('http://example.com/search?SearchableText=foo', cli),
    );

    expect(cli.search).toHaveBeenCalledTimes(1);
    expect(cli.search.mock.calls[0][0].query).toMatchObject({
      SearchableText: 'foo*',
      use_site_search_settings: 1,
      b_start: 0,
    });
    expect((result as { search: { '@id': string }[] }).search[0]['@id']).toBe(
      '/a',
    );
    expect(result).toMatchObject({ total: 1 });
  });

  it('scopes the query to the path parameter', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 0 } }),
    };

    await loader(
      makeArgs('http://example.com/search?SearchableText=foo&path=/en/', cli),
    );

    expect(cli.search.mock.calls[0][0].query.path).toEqual({ query: '/en' });
  });

  it('snaps b_start down to a page boundary', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 100 } }),
    };

    const result = await loader(
      makeArgs('http://example.com/search?SearchableText=foo&b_start=30', cli),
    );

    expect(cli.search.mock.calls[0][0].query.b_start).toBe(25);
    expect(result).toMatchObject({ bStart: 25 });
  });

  it('does not scope the global route', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 0 } }),
    };

    await loader(makeArgs('http://example.com/search?SearchableText=foo', cli));

    expect(cli.search.mock.calls[0][0].query.path).toBeUndefined();
  });

  it('redirects a b_start beyond the last page to the last page', async () => {
    const cli = {
      search: vi
        .fn()
        .mockResolvedValueOnce({ data: { items: [], items_total: 30 } }),
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
        .mockResolvedValueOnce({ data: { items: [], items_total: 3 } }),
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
