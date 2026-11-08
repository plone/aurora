import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  createAppInfoLoader,
  getAppInfo,
  getAppInfoLoaderCode,
} from '../src/addon-registry/create-app-info-loader';

const tmpDirs = [];

afterEach(() => {
  tmpDirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true }));
});

/**
 * A minimal stand-in for `AddonRegistry`, with add-ons carrying the paths the
 * real registry has.
 */
function fakeRegistry() {
  const projectRootPath = fs.mkdtempSync(
    path.join(os.tmpdir(), 'registry-app-info-'),
  );
  tmpDirs.push(projectRootPath);
  return {
    projectRootPath,
    packageJson: { name: 'my-app', version: '2.1.0', addons: ['addon-a'] },
    getAddons: () => [
      {
        name: 'addon-a',
        version: '1.0.0',
        modulePath: '/home/me/app/node_modules/addon-a/src',
        packageJson: '/home/me/app/node_modules/addon-a/package.json',
      },
      { name: 'addon-b', modulePath: '/home/me/app/packages/addon-b' },
    ],
  };
}

describe('getAppInfo', () => {
  test('has the app and its add-ons, in order, without paths', () => {
    expect(getAppInfo(fakeRegistry())).toEqual({
      name: 'my-app',
      version: '2.1.0',
      addons: [
        { name: 'addon-a', version: '1.0.0' },
        { name: 'addon-b', version: '' },
      ],
    });
  });
});

describe('createAppInfoLoader', () => {
  test('writes a module that exports the app info', () => {
    const registry = fakeRegistry();
    const loaderPath = createAppInfoLoader(registry);

    expect(loaderPath).toBe(
      path.join(registry.projectRootPath, '.plone', 'registry.appInfo.js'),
    );
    const code = fs.readFileSync(loaderPath, 'utf-8');
    expect(code).toBe(getAppInfoLoaderCode(getAppInfo(registry)));
    expect(code).not.toContain('/home/me');
    expect(code).toContain(
      `export default ${JSON.stringify(getAppInfo(registry), null, 2)};`,
    );
  });

  test('does not write the file again when it does not change', () => {
    const registry = fakeRegistry();
    const loaderPath = createAppInfoLoader(registry);
    fs.utimesSync(loaderPath, new Date(0), new Date(0));

    createAppInfoLoader(registry);

    expect(fs.statSync(loaderPath).mtimeMs).toBe(0);
  });
});
