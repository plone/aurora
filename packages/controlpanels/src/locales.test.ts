import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { messages } from './content-types/messages';

// The catalogs, in i18next's `common` namespace. `en` is generated from the
// messages: `pnpm i18n` writes it, and this test fails when it's outdated.
const LOCALES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'locales',
);

type Catalog = { [key: string]: string | Catalog };

/** `{ 'a.b': 'B' }` -> `{ a: { b: 'B' } }` (i18next `.` key separator). */
function nest(flat: Record<string, string>): Catalog {
  const catalog: Catalog = {};
  for (const [id, text] of Object.entries(flat).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const keys = id.split('.');
    let node = catalog;
    for (const key of keys.slice(0, -1)) {
      node = (node[key] ??= {}) as Catalog;
    }
    node[keys[keys.length - 1]] = text;
  }
  return catalog;
}

function flatten(catalog: Catalog, prefix = ''): Record<string, string> {
  return Object.entries(catalog).reduce<Record<string, string>>(
    (flat, [key, value]) => {
      const id = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'string'
        ? { ...flat, [id]: value }
        : { ...flat, ...flatten(value, id) };
    },
    {},
  );
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(([, name]) => name).sort();

const read = (language: string): Catalog =>
  JSON.parse(
    fs.readFileSync(path.join(LOCALES, language, 'common.json'), 'utf8'),
  );

const english = Object.fromEntries(
  Object.values(messages).map(({ id, defaultMessage }) => [id, defaultMessage]),
);

describe('the catalogs', () => {
  it('have the English messages of the code', () => {
    const expected = nest(english);
    if (process.env.UPDATE_LOCALES) {
      fs.mkdirSync(path.join(LOCALES, 'en'), { recursive: true });
      fs.writeFileSync(
        path.join(LOCALES, 'en', 'common.json'),
        `${JSON.stringify(expected, null, 2)}\n`,
      );
    }
    expect(read('en')).toEqual(expected);
  });

  const languages = fs
    .readdirSync(LOCALES)
    .filter((language) => language !== 'en');

  it.each(languages)(
    '%s only translates known messages, with their placeholders',
    (language) => {
      const translations = Object.entries(flatten(read(language)));
      expect(
        translations.filter(([id]) => !(id in english)).map(([id]) => id),
      ).toEqual([]);
      expect(
        translations
          .filter(
            ([id, text]) =>
              id in english &&
              placeholders(text).join() !== placeholders(english[id]).join(),
          )
          .map(([id]) => id),
      ).toEqual([]);
    },
  );
});
