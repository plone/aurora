import { jwtDecode } from 'jwt-decode';
import { data, createContext, redirect } from 'react-router';
import { flattenToAppURL } from '@plone/helpers';
import { clearAuthOnResponse, getAuthFromRequest } from '@plone/react-router';
import config from '@plone/registry';
import type PloneClient from '@plone/client';
import type { ReactRouterRouteEntry } from '@plone/types';
import type { Route } from './+types/root';
import { appRoutes } from './app-routes';
import installServer from './config/server.server';
import { migrateContent } from './config/server/content-migrations.server';

export const ploneClientContext = createContext<PloneClient>();
export const ploneContentContext =
  createContext<Awaited<ReturnType<PloneClient['getContent']>>['data']>();
export const ploneSiteContext =
  createContext<Awaited<ReturnType<PloneClient['getSite']>>['data']>();
export const ploneUserContext = createContext<
  Awaited<ReturnType<PloneClient['getUser']>>['data'] | null
>(null);
export const ploneClearAuthCookieContext = createContext<boolean>(false);

function getAuthorizedResourceHeaders(
  request: Request,
  token?: string,
): HeadersInit {
  const headers = new Headers(request.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }

  return headers;
}

/**
 * Returns the `PloneClient` class registered as the `ploneClient` utility,
 * extended with the methods of every registered `clientEndpoints` utility.
 */
export function getPloneClientClass() {
  const PloneClient = config
    .getUtility({
      name: 'ploneClient',
      type: 'client',
    })
    .method();

  const endpoints = config
    .getUtilities({ type: 'clientEndpoints' })
    .map((utility) => utility.method());

  return endpoints.length > 0
    ? PloneClient.extend(Object.assign({}, ...endpoints))
    : PloneClient;
}

function normalizePattern(pattern: string) {
  return pattern.split('/').filter(Boolean).join('/');
}

/**
 * Returns the patterns of the routes that set `skipContent`, or inherit it,
 * as React Router passes them to middleware (`pattern`).
 */
export function getSkipContentPatterns(
  routes: ReactRouterRouteEntry[],
  parentPath = '',
  parentSkipContent = false,
  patterns = new Set<string>(),
): Set<string> {
  for (const route of routes) {
    const skipContent = route.skipContent ?? parentSkipContent;
    const path =
      route.type === 'route' || route.type === 'prefix'
        ? `${parentPath}/${route.path}`
        : parentPath;

    if (skipContent && (route.type === 'route' || route.type === 'index')) {
      patterns.add(normalizePattern(path));
    }
    if ('children' in route && route.children) {
      getSkipContentPatterns(route.children, path, skipContent, patterns);
    }
  }
  return patterns;
}

// Routes are fixed once the add-ons are installed, so compute the patterns
// once per `config.routes` array.
const skipContentPatternsCache = new WeakMap<
  ReactRouterRouteEntry[],
  Set<string>
>();

/**
 * Whether the route matched by a request opts out of loading the Plone
 * content, site and user, with `skipContent` in its route entry.
 */
export function routeSkipsContent(pattern: string) {
  const routes = config.routes ?? [];
  let patterns = skipContentPatternsCache.get(routes);
  if (!patterns) {
    patterns = getSkipContentPatterns([...appRoutes, ...routes]);
    skipContentPatternsCache.set(routes, patterns);
  }
  return patterns.has(normalizePattern(pattern));
}

export const installServerMiddleware: Route.MiddlewareFunction = async (
  { request, context },
  next,
) => {
  installServer();
};

export const PloneClientMiddleware: Route.MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const token = await getAuthFromRequest(request);

  const PloneClient = getPloneClientClass();

  const cli = PloneClient.initialize({
    apiPath: config.settings.apiPath,
    token,
  });

  context.set(ploneClientContext, cli);
};

export const otherResources: Route.MiddlewareFunction = async (
  { request, params, context },
  next,
) => {
  const path = `/${params['*'] || ''}`;

  // Ignore requests for some specific paths
  if (/.well-known\/appspecific\/com.chrome.devtools.json/.test(path)) {
    throw Response.json({});
  }

  if (
    /^https?:\/\//.test(path) ||
    /^favicon.ico\/\//.test(path) ||
    /expand/.test(path) ||
    /^\/assets/.test(path) ||
    /\.(css|css\.map)$/.test(path)
  ) {
    // eslint-disable-next-line no-console
    console.log('matched path not fetched', path);
    throw data('Content Not Found', { status: 404 });
  }
};

export const getAPIResourceWithAuth: Route.MiddlewareFunction = async (
  { request, params },
  next,
) => {
  const path = `/${params['*'] || ''}`;

  if (
    /\/@@images\//.test(path) ||
    /\/@@download\//.test(path) ||
    /\/@@site-logo\//.test(path) ||
    /\/@portrait\//.test(path)
  ) {
    const token = await getAuthFromRequest(request);
    const url = `${config.settings.apiPath}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthorizedResourceHeaders(request, token),
    });

    if (token && response.status === 401) {
      const anonymousResponse = await fetch(url, {
        method: 'GET',
        headers: getAuthorizedResourceHeaders(request),
      });

      if (anonymousResponse.ok) {
        return clearAuthOnResponse(
          new Response(anonymousResponse.body, {
            status: anonymousResponse.status,
            statusText: anonymousResponse.statusText,
            headers: anonymousResponse.headers,
          }),
        );
      }

      return clearAuthOnResponse(
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }),
      );
    }

    return response;
  }
};

export const fetchPloneContent: Route.MiddlewareFunction = async (
  { request, params, context, pattern },
  next,
) => {
  if (routeSkipsContent(pattern)) return;

  const expand = ['navroot', 'breadcrumbs', 'navigation', 'actions'];
  const token = await getAuthFromRequest(request);

  let cli = context.get(ploneClientContext);

  const path = `/${params['*'] || ''}`;

  let userId = '';
  if (token) {
    try {
      const decodedToken = jwtDecode<{
        sub: string;
        exp: number;
        fullname: string | null;
      }>(token);
      userId = decodedToken.sub || '';
    } catch {}
  }

  if (userId) expand.push('types');

  const setPloneContext = (
    content: Awaited<ReturnType<PloneClient['getContent']>>,
    site: Awaited<ReturnType<PloneClient['getSite']>>,
    user: Awaited<ReturnType<PloneClient['getUser']>>['data'] | null,
  ) => {
    migrateContent(content.data);

    context.set(ploneContentContext, flattenToAppURL(content.data));
    context.set(ploneSiteContext, flattenToAppURL(site.data));
    context.set(ploneUserContext, user);
  };

  try {
    const [content, site, user] = await Promise.all([
      cli.getContent({ path, expand }),
      cli.getSite(),
      userId ? cli.getUser({ id: userId }).catch(() => null) : null,
    ]);

    setPloneContext(content, site, user?.data ?? null);
  } catch (error: any) {
    if (error.status >= 300 && error.status < 400 && error.location) {
      return redirect(error.location, {
        status: error.status,
      });
    }
    if (token && error?.status === 401) {
      const PloneClient = getPloneClientClass();
      cli = PloneClient.initialize({
        apiPath: config.settings.apiPath,
      });
      context.set(ploneClientContext, cli);

      try {
        const [content, site] = await Promise.all([
          cli.getContent({
            path,
            expand: expand.filter((item) => item !== 'types'),
          }),
          cli.getSite(),
        ]);

        setPloneContext(content, site, null);
        context.set(ploneClearAuthCookieContext, true);
        return;
      } catch (anonymousError: any) {
        throw data('Content Not Found', {
          status:
            typeof anonymousError.status === 'number'
              ? anonymousError.status
              : 500,
        });
      }
    }

    throw data('Content Not Found', {
      status: typeof error.status === 'number' ? error.status : 500,
    });
  }
};

export const linkMiddleware: Route.MiddlewareFunction = async (
  { context, pattern },
  next,
) => {
  if (routeSkipsContent(pattern)) return;

  const content = context.get(ploneContentContext);

  if (
    content['@type'] === 'Link' &&
    !content['@components'].actions.object.find(
      (action) => action.id === 'edit',
    )
  ) {
    return redirect(content.remoteUrl);
  }
};
