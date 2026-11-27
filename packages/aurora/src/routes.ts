import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { route } from '@react-router/dev/routes';
import type { RouteConfigEntry } from '@react-router/dev/routes';

// This module is built to `dist/routes.js`: the route modules are in `src/app`.
const appDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'app',
);

/**
 * The routes of Plone Aurora itself, for the app's `routes.ts`:
 *
 * ```ts
 * import type { RouteConfig } from '@react-router/dev/routes';
 * import { auroraRoutes } from '@plone/aurora/routes';
 * import { getAddonRoutesConfig } from '@plone/react-router/routes';
 *
 * export default [
 *   ...auroraRoutes(),
 *   ...getAddonRoutesConfig(),
 * ] satisfies RouteConfig;
 * ```
 *
 * - `ok`: a health check, which answers without the backend.
 * - `@reset-fetcher`: the route that resets a fetcher's data.
 */
export function auroraRoutes(): RouteConfigEntry[] {
  return [
    route('ok', path.join(appDir, 'okroute.tsx'), { id: 'ok' }),
    route('@reset-fetcher', path.join(appDir, 'reset-fetcher.tsx'), {
      id: 'reset-fetcher',
    }),
  ];
}
