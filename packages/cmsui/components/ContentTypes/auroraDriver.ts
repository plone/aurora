import {
  NO_CAPABILITIES,
  type ContentTypeSettings,
  type ContentTypeSummary,
  type BehaviorInfo,
  type ContentTypesCapabilities,
  type ContentTypesDriver,
  type FieldType,
  type TypeSchema,
  type WorkflowAssignments,
  type WorkflowChangeJob,
  type WorkflowChangePreview,
  type WorkflowInfo,
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

const send = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * The content types control panel's driver in Aurora. It calls Aurora's
 * `@content-types` resource routes, which run `@plone/controlpanels`'
 * plone.restapi driver on the server, with the user's credentials.
 *
 * The capabilities depend on the backend (see `contentTypesBackend`), and
 * the route loaders pass them.
 */
export function createAuroraDriver(
  capabilities: ContentTypesCapabilities = NO_CAPABILITIES,
): ContentTypesDriver {
  const typePath = (id: string) => `${API}/${encodeURIComponent(id)}`;
  // Workflow changes finish while the request waits, so the job is known.
  const jobs = new Map<string, WorkflowChangeJob>();

  const driver: ContentTypesDriver = {
    capabilities,

    listTypes: async () =>
      (await request<{ items: ContentTypeSummary[] }>(API)).items,

    createType: (type) => request<ContentTypeSummary>(API, send('POST', type)),

    deleteType: async (id) => {
      await request(typePath(id), { method: 'DELETE' });
    },

    getType: (id) => request<ContentTypeSettings>(typePath(id)),

    updateType: async (id, changes) => {
      await request(typePath(id), send('PATCH', changes));
    },

    getSchema: (id) => request<TypeSchema>(`${typePath(id)}/schema`),

    saveSchema: async (id, schema) => {
      await request(`${typePath(id)}/schema`, send('PUT', schema));
    },

    previewSchema: (id, behaviors) =>
      request<TypeSchema>(
        `${typePath(id)}/schema?${new URLSearchParams({
          behaviors: behaviors.join(','),
        })}`,
      ),

    listFieldTypes: () => request<FieldType[]>(`${API}/@field-types`),

    listBehaviors: () => request<BehaviorInfo[]>(`${API}/@behaviors`),

    listWorkflows: () => request<WorkflowInfo[]>(`${API}/@workflows`),

    getWorkflowAssignments: () =>
      request<WorkflowAssignments>(`${API}/@workflow-assignments`),

    previewWorkflowChange: (change) =>
      request<WorkflowChangePreview>(
        `${API}/@workflow-changes?preview`,
        send('POST', change),
      ),

    changeWorkflow: async (change) => {
      const job = await request<WorkflowChangeJob>(
        `${API}/@workflow-changes`,
        send('POST', change),
      );
      jobs.set(job.id, job);
      return job;
    },

    getWorkflowChangeJob: async (id) => {
      const job = jobs.get(id);
      if (!job) throw new Error(`No workflow change "${id}"`);
      return job;
    },
  };

  if (!capabilities.schemaPreview) delete driver.previewSchema;
  if (!capabilities.workflows) {
    delete driver.listWorkflows;
    delete driver.getWorkflowAssignments;
  }
  if (!capabilities.workflowChange) {
    delete driver.previewWorkflowChange;
    delete driver.changeWorkflow;
    delete driver.getWorkflowChangeJob;
  }
  return driver;
}
