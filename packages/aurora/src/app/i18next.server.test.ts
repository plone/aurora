import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import config from '@plone/registry';
import { RouterContextProvider } from 'react-router';
import { localeCookie } from '@plone/react-router';
import { ploneLocaleContext } from '@plone/react-router/context';
import { getInstance, getLocale, i18nextMiddleware } from './i18next.server';

describe('i18nextMiddleware', () => {
  // In development, the middleware reads the locales that the registry
  // generates in the app's `public/locales`, and the app is the working
  // directory. The tests give it an app with a catalog of their own.
  let appDir: string;

  beforeAll(() => {
    appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aurora-i18n-'));
    for (const [lng, save] of [
      ['en', 'Save'],
      ['de', 'Speichern'],
    ]) {
      const dir = path.join(appDir, 'public', 'locales', lng);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'common.json'),
        JSON.stringify({ cmsui: { save } }),
      );
    }
    vi.spyOn(process, 'cwd').mockReturnValue(appDir);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    fs.rmSync(appDir, { recursive: true, force: true });
  });

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

  it('sets the locale in ploneLocaleContext for add-ons', async () => {
    const context = await runMiddleware(
      new Request('http://localhost:3000/?lng=de'),
    );

    expect(context.get(ploneLocaleContext)).toBe('de');
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
