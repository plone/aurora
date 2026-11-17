import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import config from '@plone/registry';
import { RouterContextProvider } from 'react-router';
import { localeCookie } from '@plone/react-router';
import { getInstance, getLocale, i18nextMiddleware } from './i18next.server';

describe('i18nextMiddleware', () => {
  let supportedLanguages: string[];
  let defaultLanguage: unknown;

  beforeEach(() => {
    ({ supportedLanguages, defaultLanguage } = config.settings);
    // The project's configuration is applied after this module is imported,
    // like in the app, where a middleware installs it on the first request.
    config.settings.defaultLanguage = 'en';
    config.settings.supportedLanguages = ['en', 'de'];
  });

  afterEach(() => {
    config.settings.defaultLanguage = defaultLanguage;
    config.settings.supportedLanguages = supportedLanguages;
  });

  const runMiddleware = async (request: Request) => {
    const context = new RouterContextProvider();
    await i18nextMiddleware(
      {
        request,
        context,
        params: {},
        pattern: '/',
        url: new URL(request.url),
      },
      async () => new Response(),
    );
    return context;
  };

  it('uses the configured languages, not the ones at import time', async () => {
    const context = await runMiddleware(
      new Request('http://localhost:3000/?lng=de'),
    );

    expect(getLocale(context)).toBe('de');
    expect(getInstance(context).t('cmsui.save')).toBe('Speichern');
  });

  it('reads the language from the locale cookie', async () => {
    const context = await runMiddleware(
      new Request('http://localhost:3000/', {
        headers: { Cookie: await localeCookie.serialize('de') },
      }),
    );

    expect(getLocale(context)).toBe('de');
    expect(getInstance(context).t('cmsui.save')).toBe('Speichern');
  });

  it('falls back to the default language for unsupported ones', async () => {
    const context = await runMiddleware(
      new Request('http://localhost:3000/?lng=it'),
    );

    expect(getLocale(context)).toBe('en');
    expect(getInstance(context).t('cmsui.save')).toBe('Save');
  });
});
