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
 * to the add-ons that ship it, in add-on order.
 */
function fakeRegistry({ styles = {}, tailwind = [] } = {}) {
  const projectRootPath = fs.mkdtempSync(
    path.join(os.tmpdir(), 'registry-styles-'),
  );
  tmpDirs.push(projectRootPath);
  fs.mkdirSync(path.join(projectRootPath, '.plone'));

  const addons = [...new Set(Object.values(styles).flat())].map((name) => {
    const basePath = path.join(projectRootPath, 'node_modules', name);
    let packageJson;
    if (tailwind.includes(name)) {
      fs.mkdirSync(basePath, { recursive: true });
      packageJson = path.join(basePath, 'package.json');
      fs.writeFileSync(
        packageJson,
        JSON.stringify({ name, dependencies: { tailwindcss: '*' } }),
      );
    }
    return { name, basePath, packageJson };
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
    const code = buildContentLoaderCode(
      fakeRegistry({
        styles: {
          'styles/content.css': ['@plone/plate', '@plone/blocks', 'my-theme'],
        },
      }),
    );

    expect(code.match(/^@import .*$/gm)).toEqual([
      "@import '@plone/plate/styles/content.css';",
      "@import '@plone/blocks/styles/content.css';",
      "@import 'my-theme/styles/content.css';",
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
      const code = buildLoaderCode(
        fakeRegistry({ styles: { [styleSheetPath]: ['@plone/layout'] } }),
        styleSheetPath,
      );

      expect(code.match(/^@import .*$/gm)).toEqual([
        "@import './content.css' layer(plone-content);",
        `@import '@plone/layout/${styleSheetPath}';`,
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
      "@import '@plone/plate/styles/content.css';",
    );
    expect(read('publicui.css')).toContain(
      "@import './content.css' layer(plone-content);",
    );
    expect(read('cmsui.css')).toContain(
      "@import './content.css' layer(plone-content);",
    );
  });
});
