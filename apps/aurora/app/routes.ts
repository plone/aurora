import type { RouteConfig } from '@react-router/dev/routes';
import { auroraRoutes } from '@plone/aurora/routes';
import { getAddonRoutesConfig } from '@plone/react-router/routes';

export default [
  // The routes of Plone Aurora itself
  ...auroraRoutes(),
  // The routes that the add-ons register, as the registry generated them
  ...getAddonRoutesConfig(),
] satisfies RouteConfig;
