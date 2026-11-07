import { expect, test as base } from './test';
import {
  acceptanceApiURL,
  acceptanceAuthorization,
  acceptanceBackend,
} from './backend';

type MultilingualFixtures = {
  /** The site's languages, the first one being the default. */
  languages: string[];
  multilingualSite: void;
};

/**
 * A `test` whose site is multilingual: after the per-test reset, configure
 * the languages and create a published root for each language. Plone's
 * multilingual add-on creates the roots; Nick's test profile provides the
 * type and the adapter creates them through the API.
 */
export const test = base.extend<MultilingualFixtures>({
  languages: [['en', 'de'], { option: true }],
  multilingualSite: [
    async ({ request, languages, resetBackend }, use) => {
      void resetBackend;
      const apiURL = acceptanceApiURL();
      const backend = acceptanceBackend();
      const headers = {
        Accept: 'application/json',
        Authorization: await acceptanceAuthorization(
          request,
          apiURL,
          'admin',
          'secret',
        ),
      };

      const languageSettings = await request.patch(
        `${apiURL}/@controlpanels/language`,
        {
          headers,
          data: {
            available_languages: languages,
            default_language: languages[0],
            ...(backend === 'nick' ? { multilingual: true } : {}),
          },
        },
      );
      expect(languageSettings.ok()).toBe(true);

      if (backend === 'plone') {
        const install = await request.post(
          `${apiURL}/@addons/plone.app.multilingual/install`,
          { headers },
        );
        expect(install.ok()).toBe(true);
      } else {
        for (const language of languages) {
          const created = await request.post(apiURL, {
            headers,
            data: {
              '@type': 'Languageroot',
              id: language,
              title: language,
              language,
            },
          });
          expect(created.status(), await created.text()).toBe(201);
          const published = await request.post(
            `${apiURL}/${language}/@workflow/publish`,
            { headers },
          );
          expect(published.ok(), await published.text()).toBe(true);
        }
      }

      await use();
    },
    { auto: true },
  ],
});

export { expect };
