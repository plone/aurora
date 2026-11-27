import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Plugin, UserConfig } from 'vite';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { PloneAuroraVitePlugin } from './vite';

// The registry plugin generates the app's `.plone` files in the working
// directory when it's created.
vi.mock('@plone/registry/vite-plugin', () => ({
  PloneRegistryVitePlugin: () => ({ name: 'plone-registry' }),
}));

function getPlugin(name: string) {
  const plugin = PloneAuroraVitePlugin()
    .flat()
    .find((p) => (p as Plugin | undefined)?.name === name) as Plugin;
  expect(plugin).toBeDefined();
  return plugin;
}

function runConfigHook(plugin: Plugin, config: UserConfig) {
  const hook = plugin.config as (
    config: UserConfig,
    env: { command: 'build'; mode: string },
  ) => UserConfig | void;
  return hook(config, { command: 'build', mode: 'production' });
}

describe('PloneAuroraVitePlugin', () => {
  // An app that depends on `react` only: every other package comes with
  // `@plone/aurora`.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plone-aurora-app-'));
  fs.mkdirSync(path.join(root, 'node_modules', 'react'), { recursive: true });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  it('bundles the Plone packages into the server build', () => {
    const config = runConfigHook(getPlugin('plone-aurora:config'), {});
    expect(config?.ssr?.noExternal).toEqual([/^@plone\//]);
  });

  it('resolves the optimizeDeps entries that the app lacks through @plone/aurora', () => {
    const config: UserConfig = {
      root,
      optimizeDeps: {
        include: [
          'react',
          'i18next',
          '@plone/cmsui > clsx',
          '@plone/aurora',
          'not-a-package',
        ],
      },
      ssr: { optimizeDeps: { include: ['isbot'] } },
    };
    runConfigHook(getPlugin('plone-aurora:optimize-deps'), config);

    expect(config.optimizeDeps?.include).toEqual([
      // The app has it.
      'react',
      // The app doesn't, @plone/aurora does.
      '@plone/aurora > i18next',
      '@plone/aurora > @plone/cmsui > clsx',
      '@plone/aurora',
      // Neither has it: Vite reports it, as before.
      'not-a-package',
    ]);
    expect(config.ssr?.optimizeDeps?.include).toEqual([
      '@plone/aurora > isbot',
    ]);
  });
});
