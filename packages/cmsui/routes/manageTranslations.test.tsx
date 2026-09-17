import { expect, describe, it, vi, afterEach } from 'vitest';
import config from '@plone/registry';
import { loader, action } from './manageTranslations';
import { RouterContextProvider } from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
}));

const mockContent = {
  '@id': 'http://example.com/de/my-page',
  '@type': 'Document',
  title: 'My Page',
  language: { token: 'de', title: 'Deutsch' },
};

const mockTranslations = {
  '@id': 'http://example.com/de/my-page/@translations',
  items: [{ '@id': 'http://example.com/en/my-page', language: 'en' }],
  root: {
    it: 'http://example.com/it',
    fr: 'http://example.com/fr',
    de: 'http://example.com/de',
    en: 'http://example.com/en',
  },
};

describe('Manage translations route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    config.settings = {};
  });

  describe('loader', () => {
    it('should call getTranslation with the flattened content path', async () => {
      const getTranslationMock = vi
        .fn()
        .mockResolvedValue({ data: mockTranslations });
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        getTranslation: getTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
      );

      await loader({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      });

      expect(getTranslationMock).toHaveBeenCalledWith({ path: '/de/my-page' });
    });

    it('should put the current language first and sort the rest alphabetically', async () => {
      const getTranslationMock = vi
        .fn()
        .mockResolvedValue({ data: mockTranslations });
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        getTranslation: getTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
      );

      const result = await loader({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      });

      expect(result.rows.map((row) => row.language)).toEqual([
        'de',
        'en',
        'fr',
        'it',
      ]);
      expect(result.rows[0]).toEqual({
        language: 'de',
        isCurrent: true,
        translationPath: '/de/my-page',
        rootPath: '/de',
      });
      expect(result.rows.slice(1).every((row) => !row.isCurrent)).toBe(true);
    });

    it('should resolve linked translations and leave missing ones empty', async () => {
      const getTranslationMock = vi
        .fn()
        .mockResolvedValue({ data: mockTranslations });
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        getTranslation: getTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
      );

      const result = await loader({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      });

      expect(result.rows.find((row) => row.language === 'en')).toEqual({
        language: 'en',
        isCurrent: false,
        translationPath: '/en/my-page',
        rootPath: '/en',
      });
      expect(result.rows.find((row) => row.language === 'fr')).toEqual({
        language: 'fr',
        isCurrent: false,
        translationPath: null,
        rootPath: '/fr',
      });
    });

    it('should return the content title and contentPath', async () => {
      const getTranslationMock = vi
        .fn()
        .mockResolvedValue({ data: mockTranslations });
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        getTranslation: getTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
      );

      const result = await loader({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      });

      expect(result.title).toBe('My Page');
      expect(result.contentPath).toBe('/de/my-page');
    });

    it('should support a plain string language field', async () => {
      const getTranslationMock = vi
        .fn()
        .mockResolvedValue({ data: mockTranslations });
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        getTranslation: getTranslationMock,
      } as any);
      context.set(ploneContentContext, {
        ...mockContent,
        language: 'de',
      } as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
      );

      const result = await loader({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      });

      expect(result.rows[0].language).toBe('de');
      expect(result.rows[0].isCurrent).toBe(true);
    });

    it('should throw a 400 when the content is not translatable', async () => {
      const getTranslationMock = vi
        .fn()
        .mockRejectedValue(new Error('Not Found'));
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        getTranslation: getTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
      );

      await expect(
        loader({
          request,
          params: { '*': 'de/my-page' },
          context,
          unstable_pattern: '/@@manage-translations/*',
          unstable_url: new URL(request.url),
        }),
      ).rejects.toEqual(
        expect.objectContaining({
          data: 'Content is not translatable',
          init: expect.objectContaining({ status: 400 }),
        }),
      );
    });
  });

  describe('action', () => {
    it('should call linkTranslation and report success', async () => {
      const linkTranslationMock = vi.fn().mockResolvedValue({});
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        linkTranslation: linkTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'link', target: '/en/my-page' }),
        },
      );

      const result = await action({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      });

      expect(linkTranslationMock).toHaveBeenCalledWith({
        path: '/de/my-page',
        data: { id: '/en/my-page' },
      });
      expect(result).toEqual({ ok: true, intent: 'link' });
    });

    it('should call unlinkTranslation and report success', async () => {
      const unlinkTranslationMock = vi.fn().mockResolvedValue({});
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        unlinkTranslation: unlinkTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'unlink', language: 'en' }),
        },
      );

      const result = await action({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      });

      expect(unlinkTranslationMock).toHaveBeenCalledWith({
        path: '/de/my-page',
        data: { language: 'en' },
      });
      expect(result).toEqual({ ok: true, intent: 'unlink' });
    });

    it('should return the error message and status when the client rejects', async () => {
      const linkTranslationMock = vi.fn().mockRejectedValue({
        status: 400,
        data: { error: { message: 'Boom' } },
      });
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        linkTranslation: linkTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'link', target: '/en/my-page' }),
        },
      );

      const result = (await action({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      })) as any;

      expect(result.data).toEqual({ ok: false, error: 'Boom' });
      expect(result.init?.status).toBe(400);
    });

    it('should return a 400 for an unknown intent', async () => {
      const linkTranslationMock = vi.fn();
      const unlinkTranslationMock = vi.fn();
      config.settings.apiPath = 'http://example.com';
      const context = new RouterContextProvider();
      context.set(ploneClientContext, {
        linkTranslation: linkTranslationMock,
        unlinkTranslation: unlinkTranslationMock,
      } as any);
      context.set(ploneContentContext, mockContent as any);

      const request = new Request(
        'http://example.com/@@manage-translations/de/my-page',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'copy' }),
        },
      );

      const result = (await action({
        request,
        params: { '*': 'de/my-page' },
        context,
        unstable_pattern: '/@@manage-translations/*',
        unstable_url: new URL(request.url),
      })) as any;

      expect(linkTranslationMock).not.toHaveBeenCalled();
      expect(unlinkTranslationMock).not.toHaveBeenCalled();
      expect(result.data).toEqual({ ok: false, error: 'Unknown intent' });
      expect(result.init?.status).toBe(400);
    });
  });
});
