import {
  NO_CAPABILITIES,
  type ContentTypeSummary,
  type ContentTypesDriver,
} from '@plone/controlpanels';

/** Where the driver's resource routes live (see `routes/api/contentTypes.tsx`). */
const API = '/@content-types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      body?.message || `${response.status} ${response.statusText}`,
    );
  }
  return body as T;
}

const notYet = (what: string) => () =>
  Promise.reject(new Error(`${what} isn't supported yet`));

/**
 * The content types control panel's driver in Aurora. It calls Aurora's
 * `@content-types` resource routes, which talk to plone.restapi on the
 * server.
 *
 * Today's plone.restapi only lists, creates and deletes types, so every
 * capability is off. They turn on as plone/plone.restapi#2061 lands. The
 * type page methods come with the type page (#269, phase 3 and on).
 */
export function createAuroraDriver(): ContentTypesDriver {
  return {
    capabilities: NO_CAPABILITIES,

    listTypes: async () =>
      (await request<{ items: ContentTypeSummary[] }>(API)).items,

    createType: (type) =>
      request<ContentTypeSummary>(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type),
      }),

    deleteType: async (id) => {
      await request(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },

    getType: notYet('Reading a type'),
    updateType: notYet('Changing a type'),
    getSchema: notYet('Reading a schema'),
    saveSchema: notYet('Saving a schema'),
    listBehaviors: notYet('Listing behaviors'),
  };
}
