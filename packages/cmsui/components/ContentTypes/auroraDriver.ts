import {
  NO_CAPABILITIES,
  type ContentTypeSettings,
  type ContentTypeSummary,
  type BehaviorInfo,
  type ContentTypesDriver,
  type FieldType,
  type TypeSchema,
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

/**
 * The content types control panel's driver in Aurora. It calls Aurora's
 * `@content-types` resource routes, which talk to plone.restapi on the
 * server.
 *
 * Today's plone.restapi only lists, creates and deletes types, so every
 * capability is off: a type's settings are its name, description and what it
 * can contain. They turn on as plone/plone.restapi#2061 lands. Schemas use
 * `@types`, which can't reorder fieldsets. Behaviors are an unordered on/off
 * map, without the fields they add.
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

    getType: (id) =>
      request<ContentTypeSettings>(`${API}/${encodeURIComponent(id)}`),

    updateType: async (id, changes) => {
      await request(`${API}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
    },

    getSchema: (id) =>
      request<TypeSchema>(`${API}/${encodeURIComponent(id)}/schema`),

    saveSchema: async (id, schema) => {
      await request(`${API}/${encodeURIComponent(id)}/schema`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema),
      });
    },

    listFieldTypes: () => request<FieldType[]>(`${API}/@field-types`),

    listBehaviors: () => request<BehaviorInfo[]>(`${API}/@behaviors`),
  };
}
