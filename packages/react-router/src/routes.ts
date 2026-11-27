/**
 * Build-time helpers: they turn the routes registered in `@plone/registry`
 * into the React Router route config of the app's `routes.ts`. They use
 * `@react-router/dev` and `node:path`, so they live apart from the runtime
 * code in the main entry.
 */
import { route, index, layout, prefix } from '@react-router/dev/routes';
import type { RouteConfig, RouteConfigEntry } from '@react-router/dev/routes';
import type { ReactRouterRouteEntry } from '@plone/types';
import { routeId } from '@plone/registry';
import path from 'node:path';

type AddonInfo = { name: string; modulePath: string };

/**
 * The add-on a route's `file` belongs to: the add-on whose name is the start
 * of the file, followed by `/`. The longest name wins, so `@plone/cmsui-extra`
 * and `@plone/cmsui` are told apart.
 */
function addonOfFile(file: string, addonsInfo: Array<AddonInfo>) {
  return addonsInfo
    .filter((addon) => file.startsWith(`${addon.name}/`))
    .sort((a, b) => b.name.length - a.name.length)[0];
}

/** The file on disk: an add-on's module name replaced by its folder. */
function resolveFile(file: string, addonsInfo: Array<AddonInfo>) {
  const addon = addonOfFile(file, addonsInfo);
  return addon
    ? path.join(addon.modulePath, file.slice(addon.name.length))
    : file;
}

/**
 * Turns the routes registered in `@plone/registry` into React Router route
 * config.
 *
 * Each route gets its registry id (`routeId`) as its React Router id: its
 * explicit `options.id`, or else its file as registered, without its
 * extension, e.g. `@plone/cmsui/routes/edit`. React Router would otherwise
 * use the file on disk, an absolute path that differs on every machine.
 */
export function getAddonRoutesConfig(
  routesConfig: Array<ReactRouterRouteEntry>,
  addonsInfo: Array<AddonInfo>,
): Array<RouteConfigEntry> {
  const result = toRouteConfig(routesConfig, addonsInfo);
  warnAboutDuplicatePaths(result);
  return result;
}

function toRouteConfig(
  routesConfig: Array<ReactRouterRouteEntry>,
  addonsInfo: Array<AddonInfo>,
): Array<RouteConfigEntry> {
  const resultRoutesConfig: RouteConfig = [];

  for (const routeConfig of routesConfig) {
    switch (routeConfig.type) {
      case 'route': {
        const children = routeConfig.children
          ? toRouteConfig(routeConfig.children, addonsInfo)
          : undefined;
        resultRoutesConfig.push(
          route(
            routeConfig.path,
            resolveFile(routeConfig.file, addonsInfo),
            { ...routeConfig.options, id: routeId(routeConfig) },
            children,
          ),
        );
        break;
      }
      case 'index':
        resultRoutesConfig.push(
          index(resolveFile(routeConfig.file, addonsInfo), {
            ...routeConfig.options,
            id: routeId(routeConfig),
          }),
        );
        break;

      case 'layout': {
        const children = routeConfig.children
          ? toRouteConfig(routeConfig.children, addonsInfo)
          : undefined;
        resultRoutesConfig.push(
          layout(
            resolveFile(routeConfig.file, addonsInfo),
            { ...routeConfig.options, id: routeId(routeConfig) },
            children,
          ),
        );
        break;
      }
      case 'prefix':
        resultRoutesConfig.push(
          ...prefix(
            routeConfig.path,
            toRouteConfig(routeConfig.children, addonsInfo),
          ),
        );
        break;
      default:
        break;
    }
  }
  return resultRoutesConfig;
}

/**
 * Warns when two routes match the same URL: React Router then picks one by
 * its own ranking, which is easy to miss when two add-ons register the same
 * path. Use `config.overrideRoute` to replace a route instead.
 */
function warnAboutDuplicatePaths(routes: Array<RouteConfigEntry>) {
  const seen = new Map<string, string>();
  const walk = (entries: Array<RouteConfigEntry>, parentPath: string) => {
    for (const entry of entries) {
      const ownPath = entry.path
        ? `${parentPath}/${entry.path.replace(/^\/|\/$/g, '')}`
        : parentPath;
      // A layout adds no URL; an index route matches its parent's URL.
      if (entry.path !== undefined || entry.index) {
        const key = `${ownPath || '/'}${entry.index ? ' (index)' : ''}`;
        const other = seen.get(key);
        if (other !== undefined && other !== entry.id) {
          // eslint-disable-next-line no-console
          console.warn(
            `[@plone/react-router] The routes "${other}" and "${entry.id}" both match ${key}.`,
          );
        } else {
          seen.set(key, entry.id ?? entry.file);
        }
      }
      if (entry.children) walk(entry.children, ownPath);
    }
  };
  walk(routes, '');
}
