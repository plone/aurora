import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { loader } from './layout';
import { ploneContentContext } from '@plone/aurora/app/middleware.server';

vi.mock('@plone/aurora/app/i18next.server', () => ({
  i18nextMiddleware: vi.fn(),
  getLocale: vi.fn().mockReturnValue('en'),
}));

describe('Contents layout loader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads content from middleware context and returns locale', async () => {
    const context = new RouterContextProvider();
    context.set(ploneContentContext, {
      '@id': '/plone/news',
      title: 'News',
      language: { token: 'en' },
    } as any);

    const request = new Request('http://example.com/@@contents/news');

    const result = await loader({
      request,
      context,
      params: { '*': 'news' },
      pattern: '/@@contents/*',
      url: new URL(request.url),
    });

    expect(result).toEqual({
      locale: 'en',
      content: {
        '@id': '/plone/news',
        title: 'News',
        language: { token: 'en' },
      },
      path: '/news',
    });
  });
});
