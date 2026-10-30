import { jwtDecode } from 'jwt-decode';
import { data, createContext, redirect } from 'react-router';
import { flattenToAppURL } from '@plone/helpers';
import { clearAuthOnResponse, getAuthFromRequest } from '@plone/react-router';
import config from '@plone/registry';
import type PloneClient from '@plone/client';
import type { Route } from './+types/root';
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

/**
 * Where the site root sends a visitor on a multilingual site: the default
 * language root — what Plone's language-switcher view on the site root and
 * Volto's MultilingualRedirector do. The root is managed through its
 * contents view, never visited. The target is the site's default language,
 * not the negotiated interface locale (the locale says nothing about the
 * content tree), and only a language token is accepted as a target.
 */
export function multilingualRootRedirect(
  pathname: string,
  site: Awaited<ReturnType<PloneClient['getSite']>>['data'] | undefined,
): string | undefined {
  if (pathname !== '/' || !site?.features?.multilingual) return undefined;
  const language = site['plone.default_language'];
  return typeof language === 'string' &&
    /^[a-z]{2,3}(-[a-z]{2,4})?$/.test(language)
    ? `/${language}`
    : undefined;
}

/**
 * Where a 401 sends a visitor who is not signed in: the login page, with the
 * requested path as `return_url`, as Volto's Unauthorized view does. No
 * redirect when the request is for the login page itself — the root
 * middleware runs for `/login` with an empty splat, and on a site whose root
 * is private that would loop.
 */
export function unauthorizedLoginRedirect(
  path: string,
  pathname: string = path,
): string | undefined {
  if (pathname === '/login') return undefined;
  return `/login?return_url=${encodeURIComponent(path)}`;
}

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

/**
 * Whether a route pattern names a resource: one of its segments starts with
 * a single `@`, like `@search/*` or `@@contents/@delete/*`. Views use `@@`.
 */
export function isResourcePattern(pattern: string) {
  return pattern.split('/').some((segment) => /^@(?!@)/.test(segment));
}

// The health check keeps its conventional path, `/ok`, instead of `@ok`.
const HEALTH_CHECK_PATTERN = 'ok';

/**
 * Whether the route matched by a request doesn't need the Plone content,
 * site and user: resource routes (see `isResourcePattern`) and the health
 * check don't, any other route does.
 */
export function routeSkipsContent(pattern: string) {
  return (
    pattern.replace(/^\/+/, '') === HEALTH_CHECK_PATTERN ||
    isResourcePattern(pattern)
  );
}

// Module-level, so the configuration is applied once per process. During
// development, editing the configuration re-evaluates this module through
// HMR, which resets the flag and applies the new configuration.
let serverConfigInstalled = false;

export const installServerMiddleware: Route.MiddlewareFunction = async (
  { request, context },
  next,
) => {
  if (serverConfigInstalled) return;
  installServer();
  serverConfigInstalled = true;
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
    const resourceHeaders = (authToken?: string) => {
      const headers = new Headers(
        getAuthorizedResourceHeaders(request, authToken),
      );
      // The REST API's portrait endpoint is selected through JSON content
      // negotiation, even though its response is an image.
      if (/\/@portrait\//.test(path)) headers.set('Accept', 'application/json');
      return headers;
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: resourceHeaders(token),
    });

    if (token && response.status === 401) {
      const anonymousResponse = await fetch(url, {
        method: 'GET',
        headers: resourceHeaders(),
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

/**
 * Splits a request path into a content path and a `contentResource` utility
 * below it: `/news/@blocks-schema/teaser` gives `/news`, `@blocks-schema`
 * and `teaser`. The first `@`-prefixed segment after the content path that
 * names a registered utility wins. Returns undefined when none matches.
 */
export function matchContentResource(path: string) {
  const segments = path.split('/').filter(Boolean);

  for (let index = 1; index < segments.length; index++) {
    const name = segments[index];
    if (!/^@(?!@)/.test(name)) continue;
    const utility = config.getUtility({ name, type: 'contentResource' });
    if (!utility.method) continue;

    return {
      method: utility.method,
      path: `/${segments.slice(0, index).join('/')}`,
      subpath: segments.slice(index + 1).join('/') || undefined,
    };
  }
}

/**
 * Answers the requests for a resource below a content path, like
 * `/news/@blocks-schema`, with the `contentResource` utility named after the
 * resource. React Router can't match a route below a splat, so they are
 * handled here, before the content of the path is fetched.
 */
export const contentResourceMiddleware: Route.MiddlewareFunction = async ({
  request,
  params,
}) => {
  const match = matchContentResource(`/${params['*'] || ''}`);
  if (!match) return;

  return match.method({
    request,
    path: match.path,
    subpath: match.subpath,
  });
};

function matchesExpanderPath(path: string, match: string) {
  const prefix = match.replace(/\/+$/, '');
  return prefix === '' || path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Returns the components to expand in the content request of `path`, as
 * declared in `config.settings.apiExpanders` (see `defaultApiExpanders` in
 * `config/server.server.ts` for the core ones). Expanders flagged
 * `authenticated` apply only to signed-in users, so that anonymous requests,
 * and their cache keys, stay unchanged.
 */
export function getContentExpand(path: string, authenticated: boolean) {
  const expand: string[] = [];

  for (const expander of config.settings.apiExpanders ?? []) {
    // Volto-shaped expanders (`GET_CONTENT`) do not apply to Plone Aurora.
    if (!('expand' in expander)) continue;
    if (expander.authenticated && !authenticated) continue;
    if (!matchesExpanderPath(path, expander.match)) continue;
    for (const name of expander.expand) {
      if (!expand.includes(name)) expand.push(name);
    }
  }

  return expand;
}

export const fetchPloneContent: Route.MiddlewareFunction = async (
  { request, params, context, pattern, url },
  next,
) => {
  if (routeSkipsContent(pattern)) return;

  const token = await getAuthFromRequest(request);

  let cli = context.get(ploneClientContext);

  const path = `/${params['*'] || ''}`;
  // The request's path as the router matched it (a `.data` suffix already
  // stripped) — not the splat, which is empty for /login as well as for /.
  const pathname = (url ?? new URL(request.url)).pathname;

  let userId = '';
  let tokenExpired = false;
  if (token) {
    try {
      const decodedToken = jwtDecode<{
        sub: string;
        exp: number;
        fullname: string | null;
      }>(token);
      userId = decodedToken.sub || '';
      tokenExpired =
        typeof decodedToken.exp === 'number' &&
        decodedToken.exp * 1000 < Date.now();
    } catch {}
  }

  const expand = getContentExpand(path, !!userId);

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

    // On a multilingual site the root is managed, not visited: a request
    // for / — a full load or a client-side navigation — goes to the default
    // language root.
    const rootRedirect = multilingualRootRedirect(pathname, site.data);
    if (rootRedirect) return redirect(rootRedirect);
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
            expand: getContentExpand(path, false),
          }),
          cli.getSite(),
        ]);

        setPloneContext(content, site, null);
        context.set(ploneClearAuthCookieContext, true);

        // The same root rule after an expired cookie's anonymous retry; the
        // redirect leaves before the root loader, so it clears the cookie
        // itself.
        const rootRedirect = multilingualRootRedirect(pathname, site.data);
        if (rootRedirect) return clearAuthOnResponse(redirect(rootRedirect));
        return;
      } catch (anonymousError: any) {
        // An expired token is no sign-in at all (Aurora's cookie expires with
        // the token): the visitor logs in again and comes back here. A live
        // token without permission keeps the 401 page.
        const loginRedirect =
          tokenExpired && anonymousError?.status === 401
            ? unauthorizedLoginRedirect(path, pathname)
            : undefined;
        if (loginRedirect) return clearAuthOnResponse(redirect(loginRedirect));
        throw data('Content Not Found', {
          status:
            typeof anonymousError.status === 'number'
              ? anonymousError.status
              : 500,
        });
      }
    }

    const loginRedirect =
      !token && error?.status === 401
        ? unauthorizedLoginRedirect(path, pathname)
        : undefined;
    if (loginRedirect) return redirect(loginRedirect);

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
