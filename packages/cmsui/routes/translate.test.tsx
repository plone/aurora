import { expect, describe, it, vi, afterEach } from 'vitest';
import config from '@plone/registry';
import { loader, action } from './translate';
import { RouterContextProvider } from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
}));

const mockSchema = {
  title: 'Page',
  fieldsets: [
    { id: 'default', title: 'Default', fields: ['title', 'description'] },
  ],
  properties: {
    title: { title: 'Title', type: 'string' },
    description: { title: 'Description', type: 'string' },
  },
  required: ['title'],
};

const mockSource = {
  '@id': 'http://example.com/en/my-page',
  '@type': 'Document',
  title: 'My Page',
  description: 'A test page',
  language: { title: 'English', token: 'en' },
  blocks: {
    __somersault__: {
      '@type': '__somersault__',
      value: [
        { type: 'title', children: [{ text: 'My Page' }] },
        { type: 'p', children: [{ text: 'Hello world' }] },
        {
          type: 'unknown',
          '@type': 'teaser',
          id: 'abc123',
          href: [{ '@id': 'http://example.com/en/other' }],
          children: [{ text: '' }],
        },
      ],
    },
  },
  blocks_layout: { items: [] },
};

const mockTranslations = {
  '@id': 'http://example.com/en/my-page/@translations',
  items: [],
  root: { en: 'http://example.com/en', de: 'http://example.com/de' },
};

function makeContext(client: Record<string, unknown>) {
  const context = new RouterContextProvider();
  context.set(ploneClientContext, client as any);
  context.set(ploneContentContext, mockSource as any);
  return context;
}

function loaderArgs(context: RouterContextProvider, url: string) {
  const request = new Request(url);
  return {
    request,
    params: { '*': 'en/my-page' },
    context,
    unstable_pattern: '/@@translate/*',
    unstable_url: new URL(request.url),
  };
}

async function caughtStatus(promise: Promise<unknown>) {
  try {
    await promise;
    return null;
  } catch (error: any) {
    return error?.init?.status ?? error?.status ?? 'unknown';
  }
}

describe('Translate route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    config.settings = {};
  });

  describe('loader', () => {
    it('returns the source and an initial with kept text and emptied data blocks', async () => {
      config.settings.apiPath = 'http://example.com';
      const context = makeContext({
        getType: vi.fn().mockResolvedValue({ data: mockSchema }),
        getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
      });

      const result = await loader(
        loaderArgs(
          context,
          'http://example.com/@@translate/en/my-page?language=de',
        ) as any,
      );

      const { source, initial, targetLanguage } = (result as any).data;
      expect(targetLanguage).toBe('de');
      expect(source.title).toBe('My Page');
      expect(initial.title).toBe('');
      expect(initial['@type']).toBe('Document');

      const value = initial.blocks.__somersault__.value;
      expect(value[0].children[0].text).toBe('My Page');
      expect(value[1].children[0].text).toBe('Hello world');
      expect(value[2]).toEqual({
        type: 'unknown',
        '@type': 'teaser',
        id: 'abc123',
        children: [{ text: '' }],
      });
    });

    it('redirects to the edit route when the translation already exists', async () => {
      config.settings.apiPath = 'http://example.com';
      const context = makeContext({
        getType: vi.fn().mockResolvedValue({ data: mockSchema }),
        getTranslation: vi.fn().mockResolvedValue({
          data: {
            ...mockTranslations,
            items: [
              { '@id': 'http://example.com/de/meine-seite', language: 'de' },
            ],
          },
        }),
      });

      try {
        await loader(
          loaderArgs(
            context,
            'http://example.com/@@translate/en/my-page?language=de',
          ) as any,
        );
        expect.unreachable('loader should redirect');
      } catch (response: any) {
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('/@@edit/de/meine-seite');
      }
    });

    it('rejects a missing target language', async () => {
      config.settings.apiPath = 'http://example.com';
      const context = makeContext({
        getType: vi.fn().mockResolvedValue({ data: mockSchema }),
        getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
      });

      const status = await caughtStatus(
        loader(
          loaderArgs(
            context,
            'http://example.com/@@translate/en/my-page',
          ) as any,
        ) as Promise<unknown>,
      );
      expect(status).toBe(400);
    });

    it('rejects a target language without a language root', async () => {
      config.settings.apiPath = 'http://example.com';
      const context = makeContext({
        getType: vi.fn().mockResolvedValue({ data: mockSchema }),
        getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
      });

      const status = await caughtStatus(
        loader(
          loaderArgs(
            context,
            'http://example.com/@@translate/en/my-page?language=fr',
          ) as any,
        ) as Promise<unknown>,
      );
      expect(status).toBe(400);
    });

    it('rejects untranslatable content', async () => {
      config.settings.apiPath = 'http://example.com';
      const context = makeContext({
        getType: vi.fn().mockResolvedValue({ data: mockSchema }),
        getTranslation: vi.fn().mockRejectedValue({ status: 404 }),
      });

      const status = await caughtStatus(
        loader(
          loaderArgs(
            context,
            'http://example.com/@@translate/en/my-page?language=de',
          ) as any,
        ) as Promise<unknown>,
      );
      expect(status).toBe(400);
    });
  });

  describe('action', () => {
    function actionArgs(context: RouterContextProvider, body: unknown) {
      const request = new Request(
        'http://example.com/@@translate/en/my-page?language=de',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      return {
        request,
        params: { '*': 'en/my-page' },
        context,
        unstable_pattern: '/@@translate/*',
        unstable_url: new URL(request.url),
      };
    }

    it('creates the translation in the language root, links it, and redirects', async () => {
      config.settings.apiPath = 'http://example.com';
      const createContent = vi
        .fn()
        .mockResolvedValue({ data: { '@id': 'http://example.com/de/titel' } });
      const linkTranslation = vi.fn().mockResolvedValue({});
      const context = makeContext({
        getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
        createContent,
        linkTranslation,
      });

      const result = await action(
        actionArgs(context, {
          title: 'Titel',
          '@id': '/should-be-stripped',
        }) as any,
      );

      expect(createContent).toHaveBeenCalledWith({
        path: '/de',
        data: expect.objectContaining({
          title: 'Titel',
          '@type': 'Document',
          language: 'de',
        }),
      });
      expect(createContent.mock.calls[0][0].data['@id']).toBeUndefined();
      expect(linkTranslation).toHaveBeenCalledWith({
        path: '/en/my-page',
        data: { id: '/de/titel' },
      });
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe(
        '/@@edit/de/titel',
      );
    });

    it('updates the translation instead when it already exists', async () => {
      config.settings.apiPath = 'http://example.com';
      const updateContent = vi.fn().mockResolvedValue({});
      const context = makeContext({
        getTranslation: vi.fn().mockResolvedValue({
          data: {
            ...mockTranslations,
            items: [
              { '@id': 'http://example.com/de/meine-seite', language: 'de' },
            ],
          },
        }),
        updateContent,
      });

      const result = await action(
        actionArgs(context, { title: 'Titel' }) as any,
      );

      expect(updateContent).toHaveBeenCalledWith({
        path: '/de/meine-seite',
        data: expect.objectContaining({ title: 'Titel' }),
      });
      expect((result as Response).headers.get('Location')).toBe(
        '/@@edit/de/meine-seite',
      );
    });
  });
});
