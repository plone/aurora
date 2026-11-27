import config from '@plone/registry';
import type PloneClient from '@plone/client';

/**
 * The Plone client class of the app: the registered `ploneClient` utility,
 * extended with the endpoints that add-ons register as `clientEndpoints`
 * utilities.
 */
export function getPloneClientClass(): typeof PloneClient {
  const PloneClientClass = config
    .getUtility({
      name: 'ploneClient',
      type: 'client',
    })
    .method();

  const endpoints = config
    .getUtilities({ type: 'clientEndpoints' })
    .map((utility) => utility.method());

  return endpoints.length > 0
    ? PloneClientClass.extend(Object.assign({}, ...endpoints))
    : PloneClientClass;
}
