import { describe, expect, it } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { loader } from './layout';
import {
  ploneContentContext,
  ploneLocaleContext,
} from '@plone/react-router/context';

describe('Contents layout loader', () => {
  it('reads content from middleware context and returns locale', async () => {
    const context = new RouterContextProvider();
    context.set(ploneLocaleContext, 'en');
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
      path: '/news',
      content: {
        '@id': '/plone/news',
        title: 'News',
        language: { token: 'en' },
      },
    });
  });
});
