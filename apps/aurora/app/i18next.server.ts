import Backend from 'i18next-fs-backend/cjs';
import { fileURLToPath } from 'node:url';
import type { RouterContextProvider } from 'react-router';
import { initReactI18next } from 'react-i18next';
import { createI18nextMiddleware } from 'remix-i18next';
import { getI18nOptions } from './i18n'; // your i18n configuration file
import { localeCookie } from '@plone/react-router';

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

let i18next: createI18nextMiddleware.ReturnType | undefined;

// Build the middleware on the first request, not at module load: the project
// and its add-ons set the supported languages after this module is imported,
// in the server configuration that the root middleware installs first.
function getI18next() {
  if (!i18next) {
    const i18n = getI18nOptions();
    i18next = createI18nextMiddleware({
      detection: {
        supportedLanguages: i18n.supportedLngs,
        fallbackLanguage: i18n.fallbackLng,
        cookie: localeCookie,
      },
      // This is the configuration for i18next used
      // when translating messages server-side only
      i18next: {
        ...i18n,
        ns: i18n.defaultNS,
        backend: {
          loadPath: `${localesPath}{{lng}}/{{ns}}.json`,
        },
      },
      // The i18next plugins the middleware's instance uses.
      // Tip: You could pass `resources` to the `i18next` configuration and avoid a backend here
      plugins: [Backend, initReactI18next],
    });
  }
  return i18next;
}

export const i18nextMiddleware: createI18nextMiddleware.ReturnType[0] = (
  args,
  next,
) => getI18next()[0](args, next);

export const getLocale = (context: Readonly<RouterContextProvider>) =>
  getI18next()[1](context);

export const getInstance = (context: Readonly<RouterContextProvider>) =>
  getI18next()[2](context);
