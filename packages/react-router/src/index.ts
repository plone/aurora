import { createCookie, redirect, type LoaderFunctionArgs } from 'react-router';
import { route, index, layout, prefix } from '@react-router/dev/routes';
import type { RouteConfig, RouteConfigEntry } from '@react-router/dev/routes';
import type { ReactRouterRouteEntry } from '@plone/types';
import path from 'node:path';

export function getAddonRoutesConfig(
  routesConfig: Array<ReactRouterRouteEntry>,
  addonsInfo: Array<any>,
): Array<RouteConfigEntry> {
  const resultRoutesConfig: RouteConfig = [];

  for (const routeConfig of routesConfig) {
    if (routeConfig.type !== 'prefix') {
      const containsAddonModule = addonsInfo.find((addon) =>
        routeConfig.file.includes(addon.name),
      );
      if (containsAddonModule) {
        routeConfig.file = path.join(
          containsAddonModule.modulePath,
          routeConfig.file.replace(containsAddonModule.name, ''),
        );
      }
    }
    switch (routeConfig.type) {
      case 'route': {
        const children = routeConfig.children
          ? (getAddonRoutesConfig(
              routeConfig.children,
              addonsInfo,
            ) as Array<RouteConfigEntry>)
          : undefined;
        resultRoutesConfig.push(
          route(
            routeConfig.path,
            routeConfig.file,
            routeConfig.options || {},
            children,
          ),
        );
        break;
      }
      case 'index':
        resultRoutesConfig.push(index(routeConfig.file, routeConfig.options));
        break;

      case 'layout': {
        const children = routeConfig.children
          ? (getAddonRoutesConfig(
              routeConfig.children,
              addonsInfo,
            ) as Array<RouteConfigEntry>)
          : undefined;
        resultRoutesConfig.push(
          layout(routeConfig.file, routeConfig.options || {}, children),
        );
        break;
      }
      case 'prefix':
        resultRoutesConfig.push(
          ...prefix(
            routeConfig.path,
            getAddonRoutesConfig(routeConfig.children, addonsInfo),
          ),
        );
        break;
      default:
        break;
    }
  }
  return resultRoutesConfig;
}

const secret = process.env.COOKIE_SECRET || 'default';
if (secret === 'default' && process.env.NODE_ENV === 'production') {
  console.warn(
    '🚨 No COOKIE_SECRET environment variable set, using default. The app is insecure in production.',
  );
}

export const cookie = createCookie('auth_seven', {
  secrets: [secret],
  // 30 days
  // maxAge: 30 * 24 * 60 * 60,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});

/** Language preference shared by i18n detection and the preferences form. */
export const localeCookie = createCookie('aurora_language', {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365,
});

export async function getAuthFromRequest(
  request: Request,
): Promise<string | undefined> {
  let token;
  try {
    token = await cookie.parse(request.headers.get('Cookie'));
  } catch {
    // asd
  }
  return token ?? undefined;
}

export async function setAuthOnResponse(
  response: Response,
  token: string,
  options?: Parameters<typeof cookie.serialize>[1],
) {
  const header = await cookie.serialize(token, options);
  response.headers.append('Set-Cookie', header);
  return response;
}

export async function clearAuthOnResponse(
  response: Response,
  options?: Parameters<typeof cookie.serialize>[1],
) {
  const header = await getClearAuthCookieHeader(options);
  response.headers.append('Set-Cookie', header);
  return response;
}

export async function getClearAuthCookieHeader(
  options?: Parameters<typeof cookie.serialize>[1],
) {
  return await cookie.serialize('', {
    maxAge: 0,
    ...options,
  });
}

export async function requireAuthCookie(request: Request) {
  const token = await getAuthFromRequest(request);
  if (!token) {
    throw await redirectWithClearedCookie('/login');
  }
  return token;
}

/**
 * Where a login sends the visitor afterwards: the request's `return_url`
 * query parameter when it names a path on this site, otherwise `fallback`,
 * the site root. A value with control characters is refused outright (a
 * browser strips tabs and line breaks, so `/\t/host` reads as `//host`), and
 * the rest is resolved with the URL parser, the way a browser reads a
 * `Location` header, so `//host` and `/\host` cannot point at another host. This
 * is the receiving half of the convention the header's login link
 * (`AnonymousTools`) sends; Plone Classic's `came_from` and Volto's
 * `return_url` behave the same way, and neither leaves the site.
 */
export function getReturnUrl(request: Request, fallback = '/'): string {
  const { origin, searchParams } = new URL(request.url);
  const returnUrl = searchParams.get('return_url');
  // eslint-disable-next-line no-control-regex
  if (!returnUrl?.startsWith('/') || /[\x00-\x1f\x7f]/.test(returnUrl)) {
    return fallback;
  }
  const target = new URL(returnUrl, origin);
  if (target.origin !== origin) {
    return fallback;
  }
  return `${target.pathname}${target.search}${target.hash}`;
}

export async function redirectIfLoggedInLoader({
  request,
}: LoaderFunctionArgs) {
  const token = await getAuthFromRequest(request);
  if (token) {
    throw redirect(getReturnUrl(request));
  }
  return null;
}

export async function redirectWithClearedCookie(url = '/') {
  return clearAuthOnResponse(redirect(url));
}
