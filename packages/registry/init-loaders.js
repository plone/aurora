import fs from 'fs';
import path from 'path';
import { createServer } from 'vite';
import { AddonRegistry } from '@plone/registry/addon-registry';
import { createAddonsLoader } from '@plone/registry/create-addons-loader';
import { createAddonsServerLoader } from '@plone/registry/create-addons-loader-server';
import { createAddonsStyleLoader } from '@plone/registry/create-addons-styles-loader';
import { createAddonsLocalesLoader } from '@plone/registry/create-addons-locales-loader';
import { PloneRegistryVitePlugin } from '@plone/registry/vite-plugin';
import config from '@plone/registry';

/**
 * Loads the add-ons' configuration in a Vite server of its own, and writes the
 * routes they register, and the add-ons, to the `.plone` folder. React Router
 * reads them when it evaluates the app's `routes.ts`, before it runs the
 * Vite plugins of the app.
 */
async function evaluateAddons(projectRootPath, addonsLoaderPath) {
  const ploneDir = path.join(projectRootPath, '.plone');

  const server = await createServer({
    root: projectRootPath,
    configFile: false,
    logLevel: 'error',
    // It only loads modules: no HMR, and no WebSocket that would take the port
    // of the app's dev server when the preset runs inside it.
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [PloneRegistryVitePlugin()],
  });

  try {
    const { default: loader, addonsInfo } =
      await server.ssrLoadModule(addonsLoaderPath);

    // The add-ons append their routes to the registry: start from none, so
    // evaluating them again in the same process doesn't repeat them.
    config.routes = [];

    writeIfChanged(
      path.join(ploneDir, 'registry.routes.json'),
      JSON.stringify(loader(config).routes, null, 2),
    );
    writeIfChanged(
      path.join(ploneDir, 'registry.addonsInfo.json'),
      JSON.stringify(addonsInfo, null, 2),
    );
  } finally {
    await server.close();
  }
}

/** Writes a file only when its content changes, so watchers don't fire. */
function writeIfChanged(file, content) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null;
  if (existing !== content) {
    fs.writeFileSync(file, content);
  }
}

/**
 * Generates the files of the Plone registry in the `.plone` folder of the app:
 * the add-on loaders, the styles and locales loaders, and the registered
 * routes and add-ons. The `init-loaders` command runs it, and so does the
 * `@plone/aurora` React Router preset, before React Router reads the app's
 * routes.
 */
export async function initPloneRegistryLoaders({
  projectRootPath = path.resolve('.'),
} = {}) {
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

  await evaluateAddons(projectRootPath, addonsLoaderPath);

  createAddonsServerLoader(
    registry.getAddonDependencies(),
    registry.getAddons(),
  );
  createAddonsStyleLoader(registry);
  createAddonsLocalesLoader(registry);

  return { registry, shadowAliases, addonsLoaderPath };
}
