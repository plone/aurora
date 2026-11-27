import fs from 'fs';
import path from 'path';
import { AddonRegistry } from '@plone/registry/addon-registry';
import { createAddonsLoader } from '@plone/registry/create-addons-loader';
import { createAddonsServerLoader } from '@plone/registry/create-addons-loader-server';
import { createThemeAddonsLoader } from '@plone/registry/create-theme-loader';
import { createAddonsStyleLoader } from '@plone/registry/create-addons-styles-loader';
import { createAddonsLocalesLoader } from '@plone/registry/create-addons-locales-loader';
import { createBlocksDocsLoader } from '@plone/registry/create-blocks-docs-loader';
import { createPlatePluginsLoaders } from '@plone/registry/create-plate-plugins-loader';
import { createAppInfoLoader } from '@plone/registry/create-app-info-loader';
import { runnerImport } from 'vite';

function getAddonViteExtenders(registry) {
  return registry
    .getAddons()
    .map((addon) => {
      const base = path.dirname(addon.packageJson);
      const viteExtendJs = path.resolve(`${base}/vite.extend.js`);
      const viteExtendTs = path.resolve(`${base}/vite.extend.ts`);

      if (fs.existsSync(viteExtendJs)) return viteExtendJs;
      if (fs.existsSync(viteExtendTs)) return viteExtendTs;
      return null;
    })
    .filter(Boolean);
}

/**
 * Loads the default export of an add-on's `vite.extend.js` or `vite.extend.ts`.
 * Vite's module runner transforms TypeScript, so both work.
 */
async function loadViteExtender(file) {
  const { module } = await runnerImport(file, {
    configFile: false,
    logLevel: 'error',
  });
  return module.default;
}

/**
 * Applies the add-ons' `vite.extend` files, in add-on order, to the Vite
 * config of the app. Each one is a function that takes the config and a
 * context (`command`, `mode`, `isSsrBuild`), and returns the new config.
 *
 * Vite lets a plugin's `config` hook change the config in place, so the result
 * replaces the contents of `config`. Plugins are already resolved by then, so a
 * `vite.extend` file can't add or remove plugins.
 */
export async function applyViteExtenders(
  config,
  env,
  files,
  load = loadViteExtender,
) {
  const context = {
    command: env.command,
    mode: env.mode,
    isSsrBuild: env.isSsrBuild,
  };
  let result = config;
  for (const file of files) {
    const extend = await load(file);
    if (typeof extend !== 'function') {
      throw new TypeError(
        `${file} must export a function that applies its Vite extension to the app configuration.`,
      );
    }
    const next = extend(result, context);
    if (typeof next === 'undefined') {
      throw new Error(
        `The Vite extension in ${file} doesn't return the config.`,
      );
    }
    result = next;
  }
  if (result === config) return config;

  if (result.plugins !== config.plugins) {
    console.warn(
      '[plone-registry] A vite.extend file changed the plugins of the Vite config. Vite has already resolved the plugins, so the change has no effect: add the plugin in the vite.config file of the app.',
    );
  }
  for (const key of Object.keys(config)) {
    if (!(key in result)) delete config[key];
  }
  Object.assign(config, result);
  return config;
}

export function relativeToAbsoluteImportPlugin(options) {
  const { packages } = options;

  const entries = Object.entries(packages);

  return {
    name: 'relative-to-absolute-imports',
    enforce: 'pre',

    async transform(code, id) {
      const normalizedId = id.split('?')[0];

      const match = entries.find(([, pkgInfo]) =>
        normalizedId.startsWith(pkgInfo.basePath),
      );

      if (!match) return;

      const [, pkgInfo] = match;

      const transformedCode = code.replace(
        /from\s+['"]((?:\.\.?)\/?[^'"]*)['"]/g,
        (full, relImport) => {
          const absImportPath = path.resolve(
            path.dirname(normalizedId),
            relImport,
          );
          const relativePath = path
            .relative(pkgInfo.basePath, absImportPath)
            .replace(/\\/g, '/');
          return `from '${pkgInfo.name}/${relativePath}'`;
        },
      );

      return {
        code: transformedCode,
        map: null,
      };
    },
  };
}

/**
 * The aliases of the `@plone/registry/styles/*.css` imports: each one resolves
 * to the stylesheet that the plugin generated in the app's `.plone` folder, so
 * an add-on can link the app's styles without knowing which app it is in.
 * The `find` is a regular expression, so a query such as `?url` is kept.
 */
export function stylesAliases(ploneDir) {
  return [
    {
      find: /^@plone\/registry\/styles\/(cmsui|publicui)\.css/,
      replacement: path.join(ploneDir, '$1.css'),
    },
  ];
}

export const PloneRegistryVitePlugin = () => {
  const projectRootPath = path.resolve('.');
  const { registry, shadowAliases } = AddonRegistry.init(projectRootPath);

  const ploneDir = path.join(projectRootPath, '.plone');
  if (!fs.existsSync(ploneDir)) {
    fs.mkdirSync(ploneDir, { recursive: true });
  }

  const addonsLoaderPath = createAddonsLoader(
    registry.getAddonDependencies(),
    registry.getAddons(),
    { tempInProject: true },
  );
  const addonsServerLoaderPath = createAddonsServerLoader(
    registry.getAddonDependencies(),
    registry.getAddons(),
  );
  const viteExtenders = getAddonViteExtenders(registry);
  createAddonsStyleLoader(registry);
  createAddonsLocalesLoader(registry);
  // The *.block.md files of the add-ons, in load order, so that an add-on
  // loaded later replaces the docs of an earlier one. Only server code
  // imports this module, for the @blocks-schema endpoint.
  const blocksDocsLoaderPath = createBlocksDocsLoader(
    registry.getAddons().map((addon) => addon.basePath ?? addon.modulePath),
    { tempInProject: true },
  );

  // The `config/plate-editor` and `config/plate-renderer` modules of the
  // add-ons, in add-on order. Only the page editor and renderer presets
  // import these loaders.
  const platePluginsLoaders = createPlatePluginsLoaders(registry);

  // The name and version of the app and of its add-ons, without any path,
  // so that the client can show them.
  const appInfoLoaderPath = createAppInfoLoader(registry);

  const [addonsThemeLoaderVariablesPath, addonsThemeLoaderMainPath] =
    createThemeAddonsLoader(registry.getCustomThemeAddons());

  const addOns = Object.keys(registry.packages);

  const addonAliases = Object.values(registry.packages).map((pkg) => ({
    find: pkg.name,
    replacement: path.resolve(pkg.basePath),
  }));

  // The config that the plugin adds to the app's config, new on each call.
  const getPluginConfig = () => ({
    ssr: {
      external: ['bcrypt', 'node-gyp-build'],
      optimizeDeps: {
        exclude: addOns,
      },
    },
    oxc: {},
    optimizeDeps: {
      exclude: addOns,
    },
    resolve: {
      alias: [
        ...shadowAliases,
        // This is still needed for internal resolution to "self"
        // in combination with shadowing
        ...addonAliases,
        // ToDo: Deprecate `theme` feature in Plone Aurora
        ...(registry.theme
          ? // Load the theme aliases from the theme config
            [
              {
                find: 'addonsThemeCustomizationsVariables',
                replacement: addonsThemeLoaderVariablesPath,
              },
              {
                find: 'addonsThemeCustomizationsMain',
                replacement: addonsThemeLoaderMainPath,
              },
            ]
          : []),
        {
          find: '@plone/registry/addons-loader-server',
          replacement: addonsServerLoaderPath,
        },
        {
          find: '@plone/registry/addons-loader',
          replacement: addonsLoaderPath,
        },
        {
          find: '@plone/registry/app-info',
          replacement: appInfoLoaderPath,
        },
        {
          find: '@plone/registry/blocks-docs',
          replacement: blocksDocsLoaderPath,
        },
        {
          find: '@plone/registry/plate-editor',
          replacement: platePluginsLoaders.editor,
        },
        {
          find: '@plone/registry/plate-renderer',
          replacement: platePluginsLoaders.renderer,
        },
        ...stylesAliases(ploneDir),
      ],
    },
  });

  return [
    relativeToAbsoluteImportPlugin({
      packages: registry.packages,
    }),
    {
      name: 'plone-registry',
      enforce: 'pre',
      async config(userConfig, env) {
        await applyViteExtenders(userConfig, env, viteExtenders);
        return getPluginConfig();
      },
    },
  ];
};
