// The server-only part of the app's root route: its middleware and loader.
// The app's `root.tsx` re-exports them, and React Router removes them, and
// this module with them, from the client build.
import {
  data,
  type LoaderFunctionArgs,
  type RouterContextProvider,
} from 'react-router';
import type { RootLoaderData } from '@plone/types';
import config from '@plone/registry';
import { getClearAuthCookieHeader } from '@plone/react-router';
import { i18nextMiddleware, getLocale } from './i18next.server';
import {
  ploneClearAuthCookieContext,
  fetchPloneContent,
  getAPIResourceWithAuth,
  contentResourceMiddleware,
  installServerMiddleware,
  PloneClientMiddleware,
  otherResources,
  ploneClientContext,
  ploneContentContext,
  ploneSiteContext,
  ploneUserContext,
  linkMiddleware,
} from './middleware.server';

export const middleware = [
  // Install the configuration first: the i18next middleware reads the
  // supported languages from it.
  installServerMiddleware,
  i18nextMiddleware,
  PloneClientMiddleware,
  otherResources,
  getAPIResourceWithAuth,
  contentResourceMiddleware,
  fetchPloneContent,
  linkMiddleware,
];

export async function loader({
  params,
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  const locale = getLocale(context);

  const cli = context.get(ploneClientContext);
  const content = context.get(ploneContentContext);
  const site = context.get(ploneSiteContext);
  const user = context.get(ploneUserContext);

  const path = `/${params['*'] || ''}`;

  const rootLoaderDataUtilities = config.getUtilities({
    type: 'rootLoaderData',
  });

  const rootContentSubRequests = config.getUtilities({
    type: 'rootContentSubRequest',
  });

  try {
    for (const utility of rootContentSubRequests) {
      await utility.method({
        cli,
        content,
        request,
        path,
        params,
        locale,
      });
    }

    const rootLoaderDataUtilitiesData = await Promise.all([
      ...rootLoaderDataUtilities.map((utility) =>
        utility.method({
          cli,
          content,
          request,
          path,
          params,
          locale,
        }),
      ),
    ]);

    // Add-ons read the root route's data as `RootLoaderData`, so the loader
    // must keep returning that shape.
    const loaderData = {
      content,
      site,
      locale,
      isAuthenticated: user !== null,
      // Each `rootLoaderData` utility returns a `{ status, data }` envelope
      // (see `config/types.ts`). Merge each utility's `data` into the root
      // loader data; utilities namespace their `data` to avoid clobbering.
      // TODO: act on `status` (e.g. propagate a non-2xx to the response).
      ...rootLoaderDataUtilitiesData
        .filter((item) => item)
        .reduce(
          (acc, item) => ({
            ...acc,
            ...(item.data as Record<string, unknown>),
          }),
          {},
        ),
    } satisfies RootLoaderData;

    return data(loaderData, {
      headers: context.get(ploneClearAuthCookieContext)
        ? {
            'Set-Cookie': await getClearAuthCookieHeader(),
          }
        : undefined,
    });
  } catch (error: any) {
    throw data('Content Not Found', {
      status: typeof error.status === 'number' ? error.status : 500,
    });
  }
}

export type RootLoader = typeof loader;
