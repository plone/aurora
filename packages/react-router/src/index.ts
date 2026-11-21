import { createCookie, redirect, type LoaderFunctionArgs } from 'react-router';
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
