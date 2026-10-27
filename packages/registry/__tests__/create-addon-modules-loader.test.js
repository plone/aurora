import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  createAddonModulesLoader,
  findAddonModules,
  getAddonModulesLoaderCode,
  validateModulePath,
} from '../src/addon-registry/create-addon-modules-loader';

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
    path.join(os.tmpdir(), 'registry-addon-modules-'),
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

describe('validateModulePath', () => {
  test('accepts a path inside the add-ons', () => {
    expect(validateModulePath('config/plate-editor')).toBe(
      'config/plate-editor',
    );
  });

  test.each(['', '/config/plate-editor', '../config', 'config/plate.ts'])(
    'rejects "%s"',
    (modulePath) => {
      expect(() => validateModulePath(modulePath)).toThrow(
        /must name a path inside the add-ons/,
      );
    },
  );
});

describe('findAddonModules', () => {
  test('finds the add-ons that have the module, in add-on order', () => {
    const registry = fakeRegistry({
      '@plone/cmsui': ['config/plate-editor.ts'],
      'addon-without': ['index.ts'],
      'addon-js': ['config/plate-editor.jsx'],
    });

    expect(findAddonModules(registry, 'config/plate-editor')).toEqual([
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
      findAddonModules(registry, 'config/plate-editor').map((m) => m.addon),
    ).toEqual(['addon']);
  });
});

describe('getAddonModulesLoaderCode', () => {
  test('without add-on modules, exports an empty list', () => {
    const code = getAddonModulesLoaderCode('config/plate-editor', []);

    expect(code).toContain('Add a ./config/plate-editor module');
    expect(code).not.toContain('import ');
    expect(code).toContain('export default [\n\n];');
  });

  test('imports every add-on module and lists it with its add-on', () => {
    const code = getAddonModulesLoaderCode('config/plate-editor', [
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

describe('createAddonModulesLoader', () => {
  test('writes the loader in .plone, named after the path', () => {
    const registry = fakeRegistry({ a: ['config/plate-editor.ts'] });

    const loaderPath = createAddonModulesLoader(
      registry,
      'config/plate-editor',
    );

    expect(loaderPath).toBe(
      path.join(
        registry.projectRootPath,
        '.plone',
        'registry.addons.config.plate-editor.js',
      ),
    );
    expect(fs.readFileSync(loaderPath, 'utf-8')).toContain(
      '{ addon: "a", module: module0 }',
    );
  });

  test('does not rewrite an unchanged loader', () => {
    const registry = fakeRegistry({ a: ['config/plate-editor.ts'] });
    const loaderPath = createAddonModulesLoader(
      registry,
      'config/plate-editor',
    );
    const past = new Date(Date.now() - 60_000);
    fs.utimesSync(loaderPath, past, past);

    createAddonModulesLoader(registry, 'config/plate-editor');

    expect(Math.round(fs.statSync(loaderPath).mtimeMs)).toBe(past.getTime());
  });
});
