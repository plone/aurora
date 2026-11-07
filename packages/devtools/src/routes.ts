import path from 'node:path';
import type { RouteInfo } from './events';

/** An entry of `routes.ts` (React Router's `RouteConfigEntry`). */
export type RouteConfigEntry = {
  id?: string;
  file: string;
  path?: string;
  index?: boolean;
  children?: RouteConfigEntry[];
};

/** A route of the server build (`virtual:react-router/server-build`). */
export type ServerBuildRoute = {
  id: string;
  parentId?: string;
  path?: string;
  index?: boolean;
  module: Record<string, unknown>;
};

export type AddonInfo = { name: string; modulePath: string };

/**
 * The id React Router gives a route without an explicit `id`: the `file`
 * string as written in the route config, without its extension (see
 * `createRouteId` in `@react-router/dev`). `getAddonRoutesConfig` makes add-on
 * files absolute, so their ids are absolute paths.
 */
export function createRouteId(file: string): string {
  return path.normalize(file.replace(/\.[a-z0-9]+$/i, ''));
}

/** Maps route ids to absolute file paths, from the resolved `routes.ts`. */
export function routeFilesById(
  entries: RouteConfigEntry[],
  appDir: string,
): Map<string, string> {
  const files = new Map<string, string>([
    ['root', path.join(appDir, 'root.tsx')],
  ]);
  const walk = (list: RouteConfigEntry[]) => {
    for (const entry of list) {
      files.set(
        entry.id ?? createRouteId(entry.file),
        path.resolve(appDir, entry.file),
      );
      if (entry.children) walk(entry.children);
    }
  };
  walk(entries);
  return files;
}

/** The add-on whose package contains `file`; the most specific one wins. */
export function addonOf(file: string, addons: AddonInfo[]) {
  return addons
    .filter((a) => file.startsWith(a.modulePath + path.sep))
    .sort((a, b) => b.modulePath.length - a.modulePath.length)[0];
}

/**
 * Combines the server build (real ids, tree, handlers) with the route config
 * (files) and the add-on registry (owners) into what the panel shows.
 */
export function buildRouteInfos(options: {
  routes: Record<string, ServerBuildRoute>;
  config: RouteConfigEntry[];
  appDir: string;
  root: string;
  addons: AddonInfo[];
}): RouteInfo[] {
  const { routes, config, appDir, root, addons } = options;
  const files = routeFilesById(config, appDir);
  return Object.values(routes).map((r) => {
    const file = files.get(r.id);
    const owner = file ? addonOf(file, addons) : undefined;
    return {
      id: r.id,
      parentId: r.parentId,
      path: r.path,
      index: r.index,
      file: file ? path.relative(root, file) : undefined,
      source: file
        ? owner
          ? `${owner.name}/${path.relative(owner.modulePath, file)}`
          : path.relative(root, file)
        : undefined,
      addon: owner?.name ?? (file ? 'app' : undefined),
      hasLoader: typeof r.module.loader === 'function',
      hasAction: typeof r.module.action === 'function',
      hasMiddleware: Array.isArray(r.module.middleware),
    };
  });
}
