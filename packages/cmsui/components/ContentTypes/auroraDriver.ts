import {
  NO_CAPABILITIES,
  type ContentTypeSettings,
  type ContentTypeSummary,
  type BehaviorInfo,
  type ContentTypesCapabilities,
  type ContentTypesDriver,
  type FieldType,
  type TypeSchema,
  type WorkflowChangeJob,
  type WorkflowChangeRequest,
  type WorkflowInfo,
} from '@plone/controlpanels';
import {
  toWorkflowChangeBody,
  toWorkflowChangeGroups,
  type WorkflowDryRunResponse,
} from '../../helpers/contentTypesApi';

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

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * The content types control panel's driver in Aurora. It calls Aurora's
 * `@content-types` resource routes, which talk to plone.restapi on the
 * server.
 *
 * The capabilities depend on the backend (see `contentTypesBackend`). With
 * today's plone.restapi, every capability is off: a type's settings are its
 * name, description and what it can contain, and behaviors are an unordered
 * on/off map. With `@content-types`, `@behaviors` and `@workflows`
 * (plone/plone.restapi#2061) the settings, the behavior order and preview,
 * copying and workflows turn on. Schemas use `@types` either way, which
 * can't reorder fieldsets.
 *
 * plone.restapi changes workflows one type at a time, while the request
 * waits, so a change is a finished job once it answers.
 */
export function createAuroraDriver(
  capabilities: ContentTypesCapabilities = NO_CAPABILITIES,
): ContentTypesDriver {
  const typePath = (id: string) => `${API}/${encodeURIComponent(id)}`;
  let workflows:
    Promise<{ default: string | null; workflows: WorkflowInfo[] }> | undefined;
  const loadWorkflows = () => {
    workflows ??= request(`${API}/@workflows`);
    // Ask again next time when it failed.
    workflows.catch(() => (workflows = undefined));
    return workflows;
  };
  const jobs = new Map<string, WorkflowChangeJob>();
  const dryRun = (type: string, change: WorkflowChangeRequest) =>
    request<WorkflowDryRunResponse>(
      `${typePath(type)}/workflow`,
      json(toWorkflowChangeBody(change, null, true)),
    );

  const driver: ContentTypesDriver = {
    capabilities,

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

    previewSchema: (id, behaviors) =>
      request<TypeSchema>(
        `${typePath(id)}/schema?${new URLSearchParams({
          behaviors: behaviors.join(','),
        })}`,
      ),

    listWorkflows: async () => (await loadWorkflows()).workflows,

    getWorkflowAssignments: async () => {
      const [{ default: fallback }, types] = await Promise.all([
        loadWorkflows(),
        driver.listTypes(),
      ]);
      return {
        default: fallback,
        types: Object.fromEntries(
          types.flatMap((type) =>
            type.workflow ? [[type.id, type.workflow]] : [],
          ),
        ),
      };
    },

    previewWorkflowChange: async (change) => {
      const types = change.types ?? [];
      const runs = await Promise.all(
        types.map(async (type) => ({
          type,
          response: await dryRun(type, change),
        })),
      );
      return {
        workflow: runs[0]?.response.workflow ?? change.workflow,
        groups: toWorkflowChangeGroups(runs),
        unaffected: runs.reduce(
          (sum, { response }) => sum + response.unaffected,
          0,
        ),
      };
    },

    changeWorkflow: async (change) => {
      let changed = 0;
      // One type at a time, as the backend changes them.
      for (const type of change.types ?? []) {
        const { current } = await dryRun(type, change);
        const result = await request<{ changed: number }>(
          `${typePath(type)}/workflow`,
          json(toWorkflowChangeBody(change, current, false)),
        );
        changed += result.changed ?? 0;
      }
      workflows = undefined;
      const job: WorkflowChangeJob = {
        id: `change-${jobs.size + 1}`,
        status: 'done',
        progress: 1,
        changed,
      };
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
