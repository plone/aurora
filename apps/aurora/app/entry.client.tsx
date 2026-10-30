import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { getI18nOptions } from './i18n';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import install from './config';

install();

async function hydrate() {
  // Read the options after `install()`, which sets the supported languages
  const i18n = getI18nOptions();
  await i18next
    .use(initReactI18next) // Tell i18next to use the react-i18next plugin
    .use(LanguageDetector) // Setup a client-side language detector
    .use(Backend) // Setup your backend
    .init({
      ...i18n, // spread the configuration
      // The language is detected server-side with remix-i18next, and the
      // layouts communicate it to the client in `<html data-locale>`. It isn't
      // `<html lang>`, which is the language of the content.
      lng: document.documentElement.dataset.locale,
      ns: i18n.defaultNS,
      backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
      detection: {
        // Without `data-locale` (a layout that doesn't set it), fall back to
        // the `<html lang>` attribute
        order: ['htmlTag'],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
        caches: [],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}
