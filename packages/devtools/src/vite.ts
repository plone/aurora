/**
 * The Vite plugin for the Plone devtools. Add it to the app's `vite.config.ts`
 * before `reactRouter()`:
 *
 * ```ts
 * import { PloneDevtoolsVitePlugin } from '@plone/devtools/vite';
 *
 * plugins: [...PloneDevtoolsVitePlugin(), reactRouter(), ...]
 * ```
 *
 * It sets `import.meta.env.PLONE_DEVTOOLS` to `true` while the dev server runs
 * with the devtools enabled, and to `false` otherwise (production builds,
 * `PLONE_DEVTOOLS=false`), so the app can load the server and client parts
 * only when they are wanted.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import {
  devtools,
  type TanStackDevtoolsViteConfig,
} from '@tanstack/devtools-vite';
import { createEventClient, type RouteInfo } from './events';
import {
  buildRouteInfos,
  type AddonInfo,
  type RouteConfigEntry,
  type ServerBuildRoute,
} from './routes';
import { recorded } from './server/buffer';

export type PloneDevtoolsOptions = {
  /**
   * Turn the devtools off. Defaults to `true`, unless the `PLONE_DEVTOOLS`
   * environment variable is `false` or `0`.
   */
  enabled?: boolean;
  /** The React Router app directory. Defaults to `app`. */
  appDirectory?: string;
  /** Options for TanStack Devtools' own Vite plugins. */
  tanstack?: TanStackDevtoolsViteConfig;
};

const envEnabled = () =>
  !['false', '0', 'off'].includes(
    String(process.env.PLONE_DEVTOOLS ?? '').toLowerCase(),
  );

async function collectRoutes(
  server: ViteDevServer,
  appDirectory: string,
): Promise<RouteInfo[]> {
  const root = server.config.root;
  const appDir = path.resolve(root, appDirectory);
  // Both go through the app's own dev server, with all its plugins and
  // aliases, so routes contributed by add-ons resolve as they do in the app.
  const build = (await server.ssrLoadModule(
    'virtual:react-router/server-build',
  )) as { routes: Record<string, ServerBuildRoute> };
  const config = (await server.ssrLoadModule(path.join(appDir, 'routes.ts')))
    .default as RouteConfigEntry[] | Promise<RouteConfigEntry[]>;
  const addonsInfoFile = path.join(root, '.plone', 'registry.addonsInfo.json');
  const addons: AddonInfo[] = fs.existsSync(addonsInfoFile)
    ? JSON.parse(fs.readFileSync(addonsInfoFile, 'utf-8'))
    : [];
  return buildRouteInfos({
    routes: build.routes,
    config: await config,
    appDir,
    root,
    addons,
  });
}

function ploneDevtoolsPlugin(appDirectory: string): Plugin {
  return {
    name: 'plone-devtools',
    apply: 'serve',
    configureServer(server) {
      const client = createEventClient();
      const sendRoutes = () =>
        collectRoutes(server, appDirectory)
          .then((routes) => client.emit('routes', { routes }))
          .catch((error: unknown) =>
            server.config.logger.error(
              `[plone-devtools] Could not collect the routes: ${String(error)}`,
            ),
          );
      client.on('panel-connected', () => {
        client.emit('replay', { events: recorded() });
        void sendRoutes();
      });
      // The add-on registry rewrites its route list on changes.
      const routesFile = path.join(
        server.config.root,
        '.plone',
        'registry.routes.json',
      );
      server.watcher.add(routesFile);
      server.watcher.on('change', (file) => {
        if (file === routesFile) void sendRoutes();
      });
    },
  };
}

export function PloneDevtoolsVitePlugin(
  options: PloneDevtoolsOptions = {},
): Plugin[] {
  const enabled = options.enabled ?? envEnabled();
  const define: Plugin = {
    name: 'plone-devtools:define',
    config(_config, { command }) {
      return {
        define: {
          'import.meta.env.PLONE_DEVTOOLS': JSON.stringify(
            enabled && command === 'serve',
          ),
        },
      };
    },
  };
  if (!enabled) return [define];
  return [
    define,
    ...devtools({
      // Off by default: it adds attributes to every JSX element.
      injectSource: { enabled: false },
      ...options.tanstack,
    }),
    ploneDevtoolsPlugin(options.appDirectory ?? 'app'),
  ];
}
