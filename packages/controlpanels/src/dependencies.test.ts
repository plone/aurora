import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The screens must run unchanged in Aurora and in Volto, so the package only
// depends on what both can provide. Framework specifics (router, i18n, data
// fetching) come in through the provider and the drivers. See AGENTS.md.
const ALLOWED = [
  'react',
  'react-dom',
  'react-aria-components',
  // React Aria Components' own dependency, for what it doesn't re-export
  // (`UNSAFE_PortalProvider`), so it adds nothing for Volto either.
  'react-aria',
  '@plone/quanta',
  // Quanta depends on it already, so it adds nothing for Volto.
  '@plone/icons',
  '@plone/helpers',
  '@plone/registry',
  'jotai',
];

const root = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    // Stories and their helpers only run in this package's Storybook.
    if (entry.isDirectory())
      return entry.name === 'stories' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) &&
      !/\.(test|stories)\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

function packageName(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

describe('dependencies', () => {
  it('only depends on packages that Aurora and Volto both have', () => {
    const declared = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ];
    expect(declared.filter((name) => !ALLOWED.includes(name))).toEqual([]);
  });

  it('only imports allowed packages in its sources', () => {
    const imports =
      /(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
    const offending: string[] = [];
    for (const file of sourceFiles(join(root, 'src'))) {
      for (const match of readFileSync(file, 'utf8').matchAll(imports)) {
        const specifier = match[1] ?? match[2];
        if (specifier.startsWith('.')) continue;
        if (!ALLOWED.includes(packageName(specifier))) {
          offending.push(`${file.slice(root.length + 1)}: ${specifier}`);
        }
      }
    }
    expect(offending).toEqual([]);
  });
});
