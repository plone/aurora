// Publishes every package of the allowlist whose current version is not on
// npm yet. `pnpm publish -r` skips versions that are already published,
// publishes in dependency order, and waits for each package to become
// available before it publishes the packages that depend on it.
//
// The npm distribution tag is decided per package and written to a top-level
// `tag` field of its manifest for the duration of the run: pnpm uses that field
// instead of `--tag`, so one recursive run can publish packages under
// different tags. The manifests are restored afterwards.
//
// Usage: node packages/scripts/publish-packages.js [--dry-run]
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// Only packages migrated to trusted publishing belong in this allowlist.
const PACKAGES = [
  'packages/types',
  'packages/icons',
  'packages/client',
  'packages/components',
  'packages/quanta',
  'packages/registry',
  'packages/helpers',
  'packages/react-router',
  'packages/plate',
  'packages/blocks',
  'packages/layout',
  'packages/theming',
  'packages/agave',
  'packages/cmsui',
  'packages/publicui',
  'packages/contents',
  'apps/aurora',
];

// These packages historically promote prereleases to `latest` as well.
const PRERELEASES_ON_LATEST = ['@plone/aurora', '@plone/client'];

// How long to wait for a published package to become available on npm before
// publishing the packages that depend on it.
const PUBLISH_WAIT_TIMEOUT_MS = 10 * 60 * 1000;

function distTag({ name, version }) {
  const prerelease = version.split('+')[0].split('-').slice(1).join('-');
  if (!prerelease || PRERELEASES_ON_LATEST.includes(name)) return 'latest';
  const identifier = prerelease.split('.')[0];
  if (!/^[a-z][a-z0-9-]*$/i.test(identifier)) {
    throw new Error(
      `Cannot derive a distribution tag from ${name}@${version}: the prerelease identifier must start with a letter.`,
    );
  }
  return identifier;
}

const originals = new Map();
try {
  for (const dir of PACKAGES) {
    const file = `${dir}/package.json`;
    const source = readFileSync(file, 'utf8');
    const manifest = JSON.parse(source);
    if (manifest.tag !== undefined) {
      throw new Error(`${file} must not declare a top-level "tag" field.`);
    }
    originals.set(file, source);
    manifest.tag = distTag(manifest);
    writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`${manifest.name}@${manifest.version} → ${manifest.tag}`);
  }

  const result = spawnSync(
    'pnpm',
    [
      'publish',
      '--recursive',
      ...PACKAGES.flatMap((dir) => ['--filter', `./${dir}`]),
      '--access',
      'public',
      '--no-git-checks',
      '--publish-wait-timeout',
      String(PUBLISH_WAIT_TIMEOUT_MS),
      ...process.argv.slice(2),
    ],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  for (const [file, source] of originals) writeFileSync(file, source);
}
