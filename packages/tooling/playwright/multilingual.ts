import { expect, test as base } from './test';

function getDefaultApiURL() {
  const hostname = process.env.BACKEND_HOST || '127.0.0.1';
  const siteId = process.env.SITE_ID || 'plone';
  return process.env.API_PATH || `http://${hostname}:55001/${siteId}`;
}

type MultilingualFixtures = {
  /** The site's languages, the first one being the default. */
  languages: string[];
  multilingualSite: void;
};

/**
 * A `test` whose site is multilingual: after the per-test backend reset, it
 * sets the available languages and installs `plone.app.multilingual`, which
 * creates a published language root folder per language (`/en`, `/de`).
 * It all happens in the test's own ZODB layer, so the reset's teardown
 * removes it and no other test sees a multilingual site.
 */
export const test = base.extend<MultilingualFixtures>({
  languages: [['en', 'de'], { option: true }],
  multilingualSite: [
    async ({ request, languages, resetBackend }, use) => {
      void resetBackend;
      const apiURL = getDefaultApiURL();
      const headers = {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
      };

      const languageSettings = await request.patch(
        `${apiURL}/@controlpanels/language`,
        {
          headers,
          data: {
            available_languages: languages,
            default_language: languages[0],
          },
        },
      );
      expect(languageSettings.ok()).toBe(true);

      const install = await request.post(
        `${apiURL}/@addons/plone.app.multilingual/install`,
        { headers },
      );
      expect(install.ok()).toBe(true);

      await use();
    },
    { auto: true },
  ],
});

export { expect };
