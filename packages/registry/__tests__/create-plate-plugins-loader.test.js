import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  createPlatePluginsLoaders,
  findPlatePluginsModules,
  getPlatePluginsLoaderCode,
} from '../src/addon-registry/create-plate-plugins-loader';

const tmpDirs = [];

afterEach(() => {
  tmpDirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true }));
});

/**
 * A minimal stand-in for `AddonRegistry`: `files` maps each add-on, in add-on
 * order, to the files it ships, relative to its folder.
 */
function fakeRegistry(files = {}) {
  const projectRootPath = fs.mkdtempSync(
    path.join(os.tmpdir(), 'registry-plate-plugins-'),
  );
  tmpDirs.push(projectRootPath);

  const packages = Object.fromEntries(
    Object.entries(files).map(([name, addonFiles]) => {
      const basePath = path.join(projectRootPath, 'node_modules', name);
      addonFiles.forEach((file) => {
        fs.mkdirSync(path.dirname(path.join(basePath, file)), {
          recursive: true,
        });
        fs.writeFileSync(path.join(basePath, file), 'export default {};\n');
      });
      return [name, { modulePath: basePath, basePath }];
    }),
  );

  return {
    projectRootPath,
    getAddonDependencies: () => Object.keys(files),
    packages,
  };
}

describe('findPlatePluginsModules', () => {
  test('finds the add-ons that have the module, in add-on order', () => {
    const registry = fakeRegistry({
      '@plone/cmsui': ['config/plate-editor.ts'],
      'addon-without': ['index.ts'],
      'addon-js': ['config/plate-editor.jsx'],
    });

    expect(findPlatePluginsModules(registry, 'config/plate-editor')).toEqual([
      {
        addon: '@plone/cmsui',
        path: path.join(
          registry.packages['@plone/cmsui'].basePath,
          'config/plate-editor.ts',
        ),
      },
      {
        addon: 'addon-js',
        path: path.join(
          registry.packages['addon-js'].basePath,
          'config/plate-editor.jsx',
        ),
      },
    ]);
  });

  test('ignores the profiles in add-on names', () => {
    const registry = fakeRegistry({ addon: ['config/plate-editor.ts'] });
    registry.getAddonDependencies = () => ['addon:profile1,profile2'];

    expect(
      findPlatePluginsModules(registry, 'config/plate-editor').map(
        (m) => m.addon,
      ),
    ).toEqual(['addon']);
  });
});

describe('getPlatePluginsLoaderCode', () => {
  test('without add-on modules, exports an empty list', () => {
    const code = getPlatePluginsLoaderCode('config/plate-editor', []);

    expect(code).toContain('Add a ./config/plate-editor module');
    expect(code).not.toContain('import ');
    expect(code).toContain('export default [\n\n];');
  });

  test('imports every add-on module and lists it with its add-on', () => {
    const code = getPlatePluginsLoaderCode('config/plate-editor', [
      { addon: 'a', path: '/a/config/plate-editor.ts' },
      { addon: 'b', path: '/b/config/plate-editor.tsx' },
    ]);

    expect(code).toContain(
      'import module0 from "/a/config/plate-editor.ts";\nimport module1 from "/b/config/plate-editor.tsx";',
    );
    expect(code).toContain(
      '  { addon: "a", module: module0 },\n  { addon: "b", module: module1 },',
    );
  });
});

describe('createPlatePluginsLoaders', () => {
  test('writes the editor and renderer loaders in .plone', () => {
    const registry = fakeRegistry({
      a: ['config/plate-editor.ts'],
      b: ['config/plate-editor.ts', 'config/plate-renderer.tsx'],
    });

    const loaders = createPlatePluginsLoaders(registry);

    expect(loaders).toEqual({
      editor: path.join(
        registry.projectRootPath,
        '.plone',
        'registry.plate.editor.js',
      ),
      renderer: path.join(
        registry.projectRootPath,
        '.plone',
        'registry.plate.renderer.js',
      ),
    });
    const editor = fs.readFileSync(loaders.editor, 'utf-8');
    expect(editor).toContain('{ addon: "a", module: module0 }');
    expect(editor).toContain('{ addon: "b", module: module1 }');
    const renderer = fs.readFileSync(loaders.renderer, 'utf-8');
    expect(renderer).toContain('{ addon: "b", module: module0 }');
    expect(renderer).not.toContain('addon: "a"');
  });

  test('does not rewrite an unchanged loader', () => {
    const registry = fakeRegistry({ a: ['config/plate-editor.ts'] });
    const { editor } = createPlatePluginsLoaders(registry);
    const past = new Date(Date.now() - 60_000);
    fs.utimesSync(editor, past, past);

    createPlatePluginsLoaders(registry);

    expect(Math.round(fs.statSync(editor).mtimeMs)).toBe(past.getTime());
  });
});
