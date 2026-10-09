import type { ReactRouterRouteEntry } from '@plone/types';

/**
 * The app's own routes, besides the ones add-ons register in the registry.
 * `routes.ts` builds them, and the root middleware reads their metadata.
 */
export const appRoutes: ReactRouterRouteEntry[] = [
  {
    type: 'route',
    path: 'ok',
    file: 'okroute.tsx',
    options: { id: 'ok' },
    skipContent: true,
  },
  {
    type: 'route',
    path: 'reset-fetcher',
    file: 'reset-fetcher.tsx',
    options: { id: 'reset-fetcher' },
    skipContent: true,
  },
];
