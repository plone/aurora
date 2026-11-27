import type { RouteConfig } from '@react-router/dev/routes';
import { route } from '@react-router/dev/routes';
import { getAddonRoutesConfig } from '@plone/react-router/routes';

const routes: RouteConfig = [
  route('ok', 'okroute.tsx', { id: 'ok' }),
  route('@reset-fetcher', 'reset-fetcher.tsx', { id: 'reset-fetcher' }),
  // The routes that the add-ons register, as the registry generated them
  ...getAddonRoutesConfig(),
];

export default routes;
