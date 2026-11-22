import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import config from '@plone/registry';
import { loader } from './contents';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
}));

describe('Contents route loader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete config.settings.contentsPageSize;
  });

  const runLoader = async (url: string) => {
    const searchMock = vi.fn().mockResolvedValue({
      data: {
        '@id': 'http://example.com/++api++/@search',
        items: [],
        items_total: 0,
      },
    });
    const context = new RouterContextProvider();
    context.set(ploneClientContext, { search: searchMock } as any);
    context.set(ploneContentContext, { '@id': '/plone', title: 'Home' } as any);
    const request = new Request(url);
    const result = await loader({
      request,
      params: {},
      context,
      pattern: '/@@contents',
      url: new URL(request.url),
    });
    return { result, query: searchMock.mock.calls[0][0].query };
  };

  it('takes the page size from config.settings.contentsPageSize', async () => {
    config.settings.contentsPageSize = 50;
    const { result, query } = await runLoader(
      'http://example.com/@@contents?page=2',
    );
    expect(query.b_size).toBe(50);
    expect(query.b_start).toBe(100);
    expect(result.b_size).toBe(50);
  });

  it.each([[0], [-5], [2.5], ['many']])(
    'falls back to 10 items per page for an invalid page size (%s)',
    async (pageSize) => {
      config.settings.contentsPageSize = pageSize as any;
      const { query } = await runLoader('http://example.com/@@contents');
      expect(query.b_size).toBe(10);
    },
  );

  it('uses middleware contexts for content and client search', async () => {
    const searchMock = vi.fn().mockResolvedValue({
      data: {
        '@id': 'http://example.com/++api++/@search',
        items: [
          {
            '@id': 'http://example.com/++api++/doc-1',
            '@type': 'Document',
            title: 'Doc 1',
          },
        ],
        items_total: 1,
      },
    });

    const context = new RouterContextProvider();
    context.set(ploneClientContext, { search: searchMock } as any);
    context.set(ploneContentContext, {
      '@id': '/plone',
      title: 'Plone Site',
    } as any);

    const request = new Request(
      'http://example.com/@@contents/news?SearchableText=foo&page=2&sort_on=modified&sort_order=descending',
    );

    const result = await loader({
      request,
      params: { '*': 'news' },
      context,
      pattern: '/@@contents/*',
      url: new URL(request.url),
    });

    expect(searchMock).toHaveBeenCalledWith({
      query: {
        path: {
          query: '/news',
          depth: 1,
        },
        sort_on: 'modified',
        sort_order: 'descending',
        metadata_fields: '_all',
        show_inactive: true,
        b_size: 10,
        SearchableText: 'foo**',
        b_start: 20,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        content: {
          '@id': '/plone',
          title: 'Plone Site',
        },
        searchableText: 'foo',
        page: '2',
        b_size: 10,
        sort_on: 'modified',
        sort_order: 'descending',
      }),
    );
    expect(result.search.items_total).toBe(1);
    expect(result.search.items[0]).toEqual(
      expect.objectContaining({
        '@type': 'Document',
        title: 'Doc 1',
      }),
    );
  });

  it('uses the root path when no wildcard param is present', async () => {
    const searchMock = vi.fn().mockResolvedValue({
      data: {
        '@id': 'http://example.com/++api++/@search',
        items: [],
        items_total: 0,
      },
    });

    const context = new RouterContextProvider();
    context.set(ploneClientContext, { search: searchMock } as any);
    context.set(ploneContentContext, { '@id': '/plone', title: 'Home' } as any);

    const request = new Request('http://example.com/@@contents');

    await loader({
      request,
      params: {},
      context,
      pattern: '/@@contents',
      url: new URL(request.url),
    });

    expect(searchMock).toHaveBeenCalledWith({
      query: expect.objectContaining({
        path: {
          query: '/',
          depth: 1,
        },
        sort_on: 'getObjPositionInParent',
        sort_order: 'ascending',
      }),
    });
  });
});
