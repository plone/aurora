import type { RouteConfig } from '@react-router/dev/routes';
import type { ReactRouterRouteEntry } from '@plone/types';
import { getAddonRoutesConfig } from '@plone/react-router';
import { appRoutes } from './app-routes';

// eslint-disable-next-line import/no-unresolved
import addonsRoutes from '../.plone/registry.routes.json';
// eslint-disable-next-line import/no-unresolved
import addonsInfo from '../.plone/registry.addonsInfo.json';

const routes: RouteConfig = getAddonRoutesConfig(
  [...appRoutes, ...((addonsRoutes as ReactRouterRouteEntry[]) || [])],
  addonsInfo,
);

export default routes;
