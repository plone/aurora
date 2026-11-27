import { describe, expect, it, vi } from 'vitest';
import {
  applyViteExtenders,
  relativeToAbsoluteImportPlugin,
  stylesAliases,
} from '../vite-plugin';

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

describe('applyViteExtenders', () => {
  const env = { command: 'build', mode: 'production', isSsrBuild: true };
  const loaderOf =
    (extenders: Record<string, unknown>) => async (file: string) =>
      extenders[file];

  it('applies the extenders in order, with the context of the run', async () => {
    const config: Record<string, any> = { optimizeDeps: { include: ['a'] } };
    const contexts: unknown[] = [];
    const extend = (entry: string) => (current: any, context: unknown) => {
      contexts.push(context);
      return {
        ...current,
        optimizeDeps: { include: [...current.optimizeDeps.include, entry] },
      };
    };

    await applyViteExtenders(
      config,
      env,
      ['first', 'second'],
      loaderOf({ first: extend('b'), second: extend('c') }),
    );

    expect(config.optimizeDeps.include).toEqual(['a', 'b', 'c']);
    expect(contexts).toEqual([
      { command: 'build', mode: 'production', isSsrBuild: true },
      { command: 'build', mode: 'production', isSsrBuild: true },
    ]);
  });

  it('changes the config in place, removing what an extender left out', async () => {
    const config: Record<string, any> = { define: { A: 1 }, server: {} };

    const result = await applyViteExtenders(
      config,
      env,
      ['drop-define'],
      loaderOf({ 'drop-define': () => ({ server: {} }) }),
    );

    expect(result).toBe(config);
    expect(config).toEqual({ server: {} });
  });

  it('fails when an extender returns nothing', async () => {
    await expect(
      applyViteExtenders({}, env, ['broken'], loaderOf({ broken: () => {} })),
    ).rejects.toThrow("broken doesn't return the config");
  });

  it('fails when a file exports no function', async () => {
    await expect(
      applyViteExtenders({}, env, ['empty'], loaderOf({ empty: undefined })),
    ).rejects.toThrow('empty must export a function');
  });

  it('warns that it cannot change the plugins', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await applyViteExtenders(
      { plugins: [] },
      env,
      ['plugins'],
      loaderOf({ plugins: (current: any) => ({ ...current, plugins: [{}] }) }),
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('changed the plugins'),
    );
    warn.mockRestore();
  });
});
