import { describe, expect, it } from 'vitest';
import { relativeToAbsoluteImportPlugin, stylesAliases } from '../vite-plugin';

describe('relativeToAbsoluteImportPlugin', () => {
  let plugin: any;

  const packages = {
    '@plone/layout': {
      name: '@plone/layout',
      version: '1.0.0-alpha.1',
      isPublishedPackage: true,
      isRegisteredAddon: true,
      modulePath: '/Development/plone/seven-add-on/core/packages/layout',
      packageJson:
        '/Development/plone/seven-add-on/core/packages/layout/package.json',
      basePath: '/Development/plone/seven-add-on/core/packages/layout',
      addons: [],
    },
  };

  it('should have a name property', () => {
    plugin = relativeToAbsoluteImportPlugin({ packages });
    expect(plugin.name).toBe('relative-to-absolute-imports');
  });

  it('should handle: `./`', async () => {
    plugin = relativeToAbsoluteImportPlugin({ packages });
    const code = `import something from './module';`;
    const id = '/Development/plone/seven-add-on/core/packages/layout/index.ts';
    const result = await plugin.transform(code, id);

    expect(result.code).toContain(
      `import something from '@plone/layout/module';`,
    );
  });

  it('should handle: `../`', async () => {
    plugin = relativeToAbsoluteImportPlugin({ packages });
    const code = `import something from '../config';`;
    const id =
      '/Development/plone/seven-add-on/core/packages/layout/components/App.tsx';
    const result = await plugin.transform(code, id);

    expect(result.code).toContain(
      `import something from '@plone/layout/config';`,
    );
  });

  it('should handle: `.`', async () => {
    plugin = relativeToAbsoluteImportPlugin({ packages });
    const code = `import something from '.';`;
    const id =
      '/Development/plone/seven-add-on/core/packages/layout/components/App.tsx';
    const result = await plugin.transform(code, id);

    expect(result.code).toContain(
      `import something from '@plone/layout/components';`,
    );
  });

  it('should handle: `..`', async () => {
    plugin = relativeToAbsoluteImportPlugin({ packages });
    const code = `import something from '..';`;
    const id =
      '/Development/plone/seven-add-on/core/packages/layout/components/App.tsx';
    const result = await plugin.transform(code, id);

    expect(result.code).toContain(`import something from '@plone/layout/';`);
  });

  it('should not transform absolute imports', () => {
    const code = `import something from '@plone/types';`;
    const id = '/Development/plone/seven-add-on/core/packages/layout/index.ts';
    const result = plugin.transform(code, id);

    expect(result.code).toBeUndefined();
  });
});

describe('stylesAliases', () => {
  const ploneDir = '/my/app/.plone';
  const resolve = (importee: string) => {
    const alias = stylesAliases(ploneDir).find(({ find }) =>
      find.test(importee),
    );
    return alias ? importee.replace(alias.find, alias.replacement) : importee;
  };

  it('resolves the styles of each UI to the app stylesheet', () => {
    expect(resolve('@plone/registry/styles/cmsui.css')).toBe(
      '/my/app/.plone/cmsui.css',
    );
    expect(resolve('@plone/registry/styles/publicui.css')).toBe(
      '/my/app/.plone/publicui.css',
    );
  });

  it('keeps the query of the import', () => {
    expect(resolve('@plone/registry/styles/cmsui.css?url')).toBe(
      '/my/app/.plone/cmsui.css?url',
    );
  });

  it('does not resolve other imports', () => {
    expect(resolve('@plone/registry/styles/content.css')).toBe(
      '@plone/registry/styles/content.css',
    );
    expect(resolve('@plone/cmsui/styles/cmsui.css')).toBe(
      '@plone/cmsui/styles/cmsui.css',
    );
  });
});
