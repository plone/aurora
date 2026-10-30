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
  UID: 'source-uid',
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
    pattern: '/@@translate/*',
    url: new URL(request.url),
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

    it.each(['en', '__proto__'])(
      'rejects the target language %s',
      async (language) => {
        config.settings.apiPath = 'http://example.com';
        const context = makeContext({
          getType: vi.fn().mockResolvedValue({ data: mockSchema }),
          getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
        });

        const status = await caughtStatus(
          loader(
            loaderArgs(
              context,
              `http://example.com/@@translate/en/my-page?language=${language}`,
            ) as any,
          ) as Promise<unknown>,
        );
        expect(status).toBe(400);
      },
    );

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
        pattern: '/@@translate/*',
        url: new URL(request.url),
      };
    }

    it('creates the translation linked to the source in one request, and redirects', async () => {
      config.settings.apiPath = 'http://example.com';
      const createContent = vi
        .fn()
        .mockResolvedValue({ data: { '@id': 'http://example.com/de/titel' } });
      const linkTranslation = vi.fn();
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
          translation_of: 'source-uid',
        }),
      });
      expect(createContent.mock.calls[0][0].data['@id']).toBeUndefined();
      expect(linkTranslation).not.toHaveBeenCalled();
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe(
        '/@@edit/de/titel',
      );
    });

    it('returns a 409 without writing when the translation already exists', async () => {
      config.settings.apiPath = 'http://example.com';
      const createContent = vi.fn();
      const updateContent = vi.fn();
      const context = makeContext({
        getTranslation: vi.fn().mockResolvedValue({
          data: {
            ...mockTranslations,
            items: [
              { '@id': 'http://example.com/de/meine-seite', language: 'de' },
            ],
          },
        }),
        createContent,
        updateContent,
      });

      const result = (await action(
        actionArgs(context, { title: 'Titel' }) as any,
      )) as any;

      expect(createContent).not.toHaveBeenCalled();
      expect(updateContent).not.toHaveBeenCalled();
      expect(result.init?.status).toBe(409);
      expect(result.data.error).toEqual(expect.any(String));
    });

    it('returns a 409 when the backend reports a translation created meanwhile', async () => {
      config.settings.apiPath = 'http://example.com';
      const context = makeContext({
        getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
        createContent: vi.fn().mockRejectedValue({
          status: 503,
          data: { type: 'KeyError', message: "'Translation already exists'" },
        }),
      });

      const result = (await action(
        actionArgs(context, { title: 'Titel' }) as any,
      )) as any;

      expect(result.init?.status).toBe(409);
    });

    it('returns the server validation errors to the form', async () => {
      config.settings.apiPath = 'http://example.com';
      const context = makeContext({
        getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
        createContent: vi.fn().mockRejectedValue({
          status: 400,
          data: {
            message: JSON.stringify([
              { field: 'title', message: 'Required input is missing.' },
            ]),
          },
        }),
      });

      const result = (await action(
        actionArgs(context, { title: '' }) as any,
      )) as any;

      expect(result.init?.status).toBe(400);
      expect(result.data.errors).toEqual({
        title: ['Required input is missing.'],
      });
    });

    it('rethrows other backend errors', async () => {
      config.settings.apiPath = 'http://example.com';
      const failure = { status: 500, data: { message: 'Boom' } };
      const context = makeContext({
        getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
        createContent: vi.fn().mockRejectedValue(failure),
      });

      await expect(
        action(actionArgs(context, { title: 'Titel' }) as any),
      ).rejects.toBe(failure);
    });

    it.each(['en', '__proto__'])(
      'rejects the target language %s without creating anything',
      async (language) => {
        config.settings.apiPath = 'http://example.com';
        const createContent = vi.fn();
        const context = makeContext({
          getTranslation: vi.fn().mockResolvedValue({ data: mockTranslations }),
          createContent,
        });
        const args = actionArgs(context, { title: 'Titel' });
        const request = new Request(
          `http://example.com/@@translate/en/my-page?language=${language}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Titel' }),
          },
        );

        const status = await caughtStatus(
          action({ ...args, request, url: new URL(request.url) } as any),
        );

        expect(status).toBe(400);
        expect(createContent).not.toHaveBeenCalled();
      },
    );
  });
});
