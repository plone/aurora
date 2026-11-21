import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { loader } from './layout';
import {
  ploneClientContext,
  ploneContentContext,
  ploneSiteContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';

vi.mock('@plone/aurora/app/i18next.server', () => ({
  i18nextMiddleware: vi.fn(),
  getLocale: vi.fn().mockReturnValue('en'),
}));

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('token'),
}));

function callLoader(actions: { id: string }[]) {
  const context = new RouterContextProvider();
  context.set(ploneContentContext, {
    '@id': '/news',
    '@type': 'Folder',
    title: 'News',
    language: { token: 'en' },
    '@components': { actions: { object: actions } },
  } as any);
  context.set(ploneClientContext, {
    getWorkflow: vi.fn().mockResolvedValue({ data: {} }),
    getType: vi.fn().mockResolvedValue({ data: { layouts: [] } }),
  } as any);

  context.set(ploneSiteContext, {} as any);
  context.set(ploneUserContext, null as any);

  const request = new Request('http://example.com/@@contents/news');

  return loader({
    request,
    context,
    params: { '*': 'news' },
    pattern: '/@@contents/*',
    url: new URL(request.url),
  });
}

describe('Contents layout loader', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the content when the user can view its contents', async () => {
    const result = await callLoader([{ id: 'folderContents' }]);

    expect(result).toMatchObject({
      locale: 'en',
      path: '/news',
      content: { '@id': '/news', title: 'News' },
    });
  });

  it('refuses the view without the folderContents action', async () => {
    await expect(callLoader([{ id: 'view' }])).rejects.toMatchObject({
      init: { status: 401 },
    });
  });
});
