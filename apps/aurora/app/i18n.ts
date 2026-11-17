import config from '@plone/registry';

/**
 * The i18next options of the application. Call it once the configuration is
 * applied, not at module load: the project and its add-ons set the supported
 * languages after this module is imported.
 */
export function getI18nOptions() {
  return {
    // This is the list of languages your application supports
    supportedLngs: config.settings.supportedLanguages ?? ['en'],
    // This is the language you want to use in case
    // if the user language is not in the supportedLngs
    fallbackLng:
      (config.settings.defaultLanguage as string | undefined) ?? 'en',
    // The default namespace of i18next is "translation", but you can customize it here
    defaultNS: 'common',
  };
}
