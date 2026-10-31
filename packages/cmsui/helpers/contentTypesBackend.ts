import { apiRequest } from '@plone/client';
import type PloneClient from '@plone/client';
import type { ContentTypesBackend } from './contentTypesApi';

// How long to trust what a backend has, so each request doesn't ask again.
const TTL = 60_000;

const known = new Map<string, { at: number; backend: ContentTypesBackend }>();

/** A GET on the backend, with the client's configuration and credentials. */
export async function backendGet<T>(
  cli: PloneClient,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const response = await apiRequest('get', path, {
    config: cli.config,
    params,
  });
  return response.data as T;
}

/** A request with a body on the backend. */
export async function backendSend<T>(
  cli: PloneClient,
  method: 'post' | 'patch' | 'delete',
  path: string,
  data?: unknown,
): Promise<T> {
  const response = await apiRequest(method, path, { config: cli.config, data });
  return response.data as T;
}

/** `true` when there, `false` when not (404), `null` when it can't tell. */
const exists = (cli: PloneClient, path: string) =>
  backendGet(cli, path).then(
    () => true,
    (error: { status?: number }) => (error?.status === 404 ? false : null),
  );

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
  const answers = await Promise.all([
    exists(cli, '/@content-types/Plone%20Site'),
    exists(cli, '/@behaviors'),
    exists(cli, '/@workflows'),
  ]);
  const [contentTypes, behaviors, workflows] = answers.map(Boolean);
  const backend = {
    contentTypes,
    // The ordered behaviors and the preview come with `@behaviors`, on top
    // of `@content-types`.
    behaviors: contentTypes && behaviors,
    workflows: contentTypes && workflows,
  };
  if (!answers.includes(null)) known.set(key, { at: Date.now(), backend });
  return backend;
}
