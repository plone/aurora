import Backend from 'i18next-fs-backend/cjs';
import { fileURLToPath } from 'node:url';
import { initReactI18next } from 'react-i18next';
import { createI18nextMiddleware } from 'remix-i18next';
import i18n from './i18n'; // your i18n configuration file

// The add-on locales are generated into `public/locales`, which the build copies
// to `build/client/locales`. Resolve them relative to this module, not the
// working directory: in development it is `app/i18next.server.ts`, in
// production the server bundle `build/server/index.js`. If the server can't
// load them, it renders the raw message keys, the client renders the
// translations, and React discards the server-rendered DOM on hydration.
const localesPath = fileURLToPath(
  new URL(
    import.meta.env.PROD ? '../client/locales/' : '../public/locales/',
    import.meta.url,
  ),
);

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
        loadPath: `${localesPath}{{lng}}/{{ns}}.json`,
      },
    },
    // The i18next plugins the middleware's instance uses.
    // Tip: You could pass `resources` to the `i18next` configuration and avoid a backend here
    plugins: [Backend, initReactI18next],
  });
