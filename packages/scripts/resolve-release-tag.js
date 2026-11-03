import { readFileSync } from 'node:fs';

// Only packages migrated to trusted publishing belong in this allowlist.
const packages = [
  'types',
  'icons',
  'client',
  'components',
  'quanta',
  'registry',
  'helpers',
  'react-router',
  'plate',
  'blocks',
  'layout',
  'theming',
  'agave',
  'cmsui',
  'publicui',
  'contents',
];
const tag = process.argv[2] ?? '';
const match = /^(?:(plone-[a-z-]+)-)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(
  tag,
);
if (!match) throw new Error(`Invalid release tag: ${tag}`);
const [, prefix, version] = match;
const name = prefix?.slice('plone-'.length);
if (prefix && !packages.includes(name))
  throw new Error(`Unknown package: ${prefix}`);
const directory = prefix ? `packages/${name}` : 'apps/aurora';
const manifest = JSON.parse(readFileSync(`${directory}/package.json`, 'utf8'));
const expectedName = `@plone/${name ?? 'aurora'}`;
if (manifest.name !== expectedName || manifest.version !== version) {
  throw new Error(`Tag ${tag} does not match ${directory}/package.json`);
}
// Aurora and client historically promote prereleases to latest as well.
const distTag =
  !version.includes('-') || !prefix || name === 'client'
    ? 'latest'
    : version.split('-')[1].split('.')[0];
console.log(`directory=${directory}\ndist_tag=${distTag}`);
