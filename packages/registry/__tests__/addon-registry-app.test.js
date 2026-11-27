import path from 'path';
import { AddonRegistry } from '../src/addon-registry/addon-registry';
import { describe, it, expect } from 'vitest';

describe('AddonRegistry - get()', () => {
  it('Basic information', () => {
    const base = path.join(import.meta.dirname, 'fixtures', 'test-app');
    const { addons, shadowAliases, theme } = AddonRegistry.init(base);
    expect(addons).toStrictEqual(['@plone/layout', 'my-addon']);
    expect(shadowAliases).toStrictEqual([
      {
        find: '@plone/layout/components/Logo/Logo.svg',
        replacement: `${base}/node_modules/my-addon/customizations/@plone/layout/components/Logo/Logo.svg`,
      },
    ]);
    expect(theme).toStrictEqual(undefined);
  });
});

describe('AddonRegistry - add-ons of a dependency', () => {
  // The app depends on a framework package only, and registers an add-on
  // that the framework depends on, as an app does with `@plone/aurora`.
  const base = path.join(import.meta.dirname, 'fixtures', 'test-framework-app');
  const addonPath = path.join(
    base,
    'node_modules',
    'my-framework',
    'node_modules',
    'framework-addon',
  );

  it('resolves the add-on through the dependency', () => {
    const { registry, addons } = AddonRegistry.init(base);
    expect(addons).toStrictEqual(['framework-addon']);
    expect(registry.packages['framework-addon'].basePath).toBe(addonPath);
  });

  it('still fails for an add-on that no dependency brings', () => {
    const { registry } = AddonRegistry.init(base);
    expect(() => registry.resolveAddon('not-an-addon')).toThrow(
      /Cannot find module 'not-an-addon'/,
    );
  });
});
