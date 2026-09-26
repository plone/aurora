import Backend from 'i18next-fs-backend/cjs';
import { resolve } from 'node:path';
import { initReactI18next } from 'react-i18next';
import { createI18nextMiddleware } from 'remix-i18next';
import i18n from './i18n'; // your i18n configuration file

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: i18n.supportedLngs,
      fallbackLanguage: i18n.fallbackLng as string,
    },
    // This is the configuration for i18next used
    // when translating messages server-side only
    i18next: {
      ...i18n,
      fallbackLng: i18n.fallbackLng as string,
      ns: i18n.defaultNS,
      backend: {
        loadPath: resolve('../locales/{{lng}}/{{ns}}.json'),
      },
    },
    // The i18next plugins the middleware's instance uses.
    // Tip: You could pass `resources` to the `i18next` configuration and avoid a backend here
    plugins: [Backend, initReactI18next],
  });
