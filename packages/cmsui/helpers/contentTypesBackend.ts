import { apiRequest } from '@plone/client';
import type PloneClient from '@plone/client';
import {
  createRestApiDriver,
  detectRestApi,
  type ContentTypesBackend,
  type ContentTypesDriver,
  type RestApiRequest,
} from '@plone/controlpanels';

// How long to trust what a backend has, so each request doesn't ask again.
const TTL = 60_000;

const known = new Map<string, { at: number; backend: ContentTypesBackend }>();

/** plone.restapi requests with the client's configuration and credentials. */
export function restApiRequest(cli: PloneClient): RestApiRequest {
  return async (method, path, options) =>
    (
      await apiRequest(method, path, {
        config: cli.config,
        data: options?.data,
        params: options?.params,
      })
    ).data;
}

/**
 * Which of the services of plone/plone.restapi#2061 the backend has. What it
 * has is kept for a minute per backend, unless an answer was unclear (e.g.
 * the user may not see it).
 */
export async function contentTypesBackend(
  cli: PloneClient,
): Promise<ContentTypesBackend> {
  const key = cli.config.apiPath;
  const cached = known.get(key);
  if (cached && Date.now() - cached.at < TTL) return cached.backend;
  const { backend, clear } = await detectRestApi(restApiRequest(cli));
  if (clear) known.set(key, { at: Date.now(), backend });
  return backend;
}

/** The content types driver for the backend, on the server. */
export async function contentTypesDriver(
  cli: PloneClient,
): Promise<ContentTypesDriver> {
  return createRestApiDriver(
    restApiRequest(cli),
    await contentTypesBackend(cli),
  );
}
