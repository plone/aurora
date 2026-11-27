import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  buildContentLoaderCode,
  buildLoaderCode,
  createAddonsStyleLoader,
} from '../src/addon-registry/create-addons-styles-loader';

const tmpDirs = [];

afterEach(() => {
  tmpDirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true }));
});

/**
 * A minimal stand-in for `AddonRegistry`: `styles` maps each stylesheet path
 * to the add-ons that ship it, in add-on order. `packages` gives the
 * `package.json` of packages in `node_modules`, add-ons or not.
 */
function fakeRegistry({ styles = {}, tailwind = [], packages = {} } = {}) {
  // The real path: the registry writes the dependencies by their real path.
  const projectRootPath = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'registry-styles-')),
  );
  tmpDirs.push(projectRootPath);
  fs.mkdirSync(path.join(projectRootPath, '.plone'));

  const writePackage = (name, packageJson) => {
    const dir = path.join(projectRootPath, 'node_modules', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name, ...packageJson }),
    );
    return path.join(dir, 'package.json');
  };
  for (const [name, packageJson] of Object.entries(packages)) {
    writePackage(name, packageJson);
  }

  const addons = [...new Set(Object.values(styles).flat())].map((name) => {
    const basePath = path.join(projectRootPath, 'node_modules', name);
    let packageJson;
    if (packages[name]) {
      packageJson = path.join(basePath, 'package.json');
    } else if (tailwind.includes(name)) {
      packageJson = writePackage(name, { dependencies: { tailwindcss: '*' } });
    }
    return { name, basePath, modulePath: basePath, packageJson };
  });

  return {
    projectRootPath,
    getAddons: () => addons,
    getAddonStyles: (styleSheetPath) => styles[styleSheetPath] ?? [],
  };
}

describe('buildContentLoaderCode', () => {
  test('without add-ons shipping content styles, only has the header', () => {
    const code = buildContentLoaderCode(fakeRegistry());

    expect(code).toContain('Add a ./styles/content.css in your add-on');
    expect(code).not.toContain('@import');
  });

  test('imports every add-on content stylesheet, in add-on order', () => {
    const registry = fakeRegistry({
      styles: {
        'styles/content.css': ['@plone/plate', '@plone/blocks', 'my-theme'],
      },
    });
    const code = buildContentLoaderCode(registry);

    // By path: the app may not resolve the add-ons by name.
    const at = (name) =>
      `@import '${path.join(registry.projectRootPath, 'node_modules', name, 'styles/content.css')}';`;
    expect(code.match(/^@import .*$/gm)).toEqual([
      at('@plone/plate'),
      at('@plone/blocks'),
      at('my-theme'),
    ]);
  });

  test('emits no Tailwind sources, even for add-ons using Tailwind', () => {
    const code = buildContentLoaderCode(
      fakeRegistry({
        styles: { 'styles/content.css': ['@plone/plate'] },
        tailwind: ['@plone/plate'],
      }),
    );

    expect(code).not.toContain('@source');
  });
});

describe('buildLoaderCode', () => {
  test.each(['styles/publicui.css', 'styles/cmsui.css'])(
    '%s imports the content styles first, in the plone-content layer',
    (styleSheetPath) => {
      const registry = fakeRegistry({
        styles: { [styleSheetPath]: ['@plone/layout'] },
      });
      const code = buildLoaderCode(registry, styleSheetPath);

      expect(code.match(/^@import .*$/gm)).toEqual([
        "@import './content.css' layer(plone-content);",
        `@import '${path.join(registry.getAddons()[0].basePath, styleSheetPath)}';`,
      ]);
    },
  );

  test('still adds a Tailwind source for add-ons using Tailwind', () => {
    const registry = fakeRegistry({
      styles: { 'styles/publicui.css': ['@plone/agave'] },
      tailwind: ['@plone/agave'],
    });

    const code = buildLoaderCode(registry, 'styles/publicui.css');

    expect(code).toContain(`@source '${registry.getAddons()[0].basePath}';`);
  });

  test('adds a Tailwind source for the dependencies using Tailwind too', () => {
    const tailwind = { tailwindcss: '*' };
    const registry = fakeRegistry({
      styles: { 'styles/cmsui.css': ['my-addon', 'other-addon'] },
      packages: {
        'my-addon': {
          dependencies: {
            ...tailwind,
            'ui-lib': '*',
            'plain-lib': '*',
            'tailwind-variants': '*',
          },
        },
        // With Tailwind as a peer dependency, as packages that also ship
        // compiled CSS have it.
        'ui-lib': {
          peerDependencies: tailwind,
          dependencies: { 'nested-lib': '*' },
        },
        'nested-lib': { dependencies: tailwind },
        'plain-lib': { dependencies: { 'hidden-lib': '*' } },
        'hidden-lib': { dependencies: tailwind },
        // Tailwind's own packages and plugins aren't scanned.
        'tailwind-variants': { peerDependencies: tailwind },
        'other-addon': { dependencies: { ...tailwind, 'ui-lib': '*' } },
      },
    });

    const code = buildLoaderCode(registry, 'styles/cmsui.css');

    const dir = (name) =>
      path.join(registry.projectRootPath, 'node_modules', name);
    expect(code.match(/^@source .*$/gm)).toEqual([
      `@source '${dir('my-addon')}';`,
      `@source '${dir('ui-lib')}';`,
      `@source '${dir('nested-lib')}';`,
      // Each folder once.
      `@source '${dir('other-addon')}';`,
    ]);
  });
});

describe('createAddonsStyleLoader', () => {
  test('writes the content, Public UI and CMSUI loaders', () => {
    const registry = fakeRegistry({
      styles: {
        'styles/content.css': ['@plone/plate'],
        'styles/publicui.css': ['@plone/layout'],
        'styles/cmsui.css': ['@plone/cmsui'],
      },
    });

    createAddonsStyleLoader(registry);

    const read = (file) =>
      fs.readFileSync(path.join(registry.projectRootPath, '.plone', file), {
        encoding: 'utf-8',
      });
    expect(read('content.css')).toContain(
      `@import '${path.join(registry.projectRootPath, 'node_modules', '@plone/plate', 'styles/content.css')}';`,
    );
    expect(read('publicui.css')).toContain(
      "@import './content.css' layer(plone-content);",
    );
    expect(read('cmsui.css')).toContain(
      "@import './content.css' layer(plone-content);",
    );
  });
});
