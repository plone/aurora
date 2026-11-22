import type { ContentTypesDriver } from '../driver';
import type {
  BehaviorInfo,
  TypeSchema,
  WorkflowChangeJob,
  WorkflowChangeRequest,
} from '../types';
import {
  toCapabilities,
  toContentTypePatch,
  toSettings,
  toSummary,
  toWorkflowChangeBody,
  toWorkflowChangeGroups,
  toWorkflowInfo,
  type ContentTypeResponse,
  type ContentTypesBackend,
  type WorkflowDryRunResponse,
  type WorkflowResponse,
} from './contentTypesService';
import {
  errorMessage,
  toBehaviors,
  toContentTypeSettings,
  toContentTypeSummary,
  toDexterityTypePatch,
  toFieldTypes,
  toTypeSchemaPut,
  type DexterityTypeResponse,
  type DexterityTypesItem,
} from './dexterityTypes';

/**
 * Calls plone.restapi: `path` is relative to the site, e.g. `/@types/Event`.
 * Resolves with the response's body, and rejects on an error status with an
 * error whose `status` is the status and whose `data` (or `response.body`) is
 * the body, like `@plone/client` and Volto's `Api` do. Every app passes its
 * own, with its credentials.
 */
export type RestApiRequest = <T = unknown>(
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  options?: { data?: unknown; params?: Record<string, string> },
) => Promise<T>;

/** The status of a failed request, from what a `RestApiRequest` rejects with. */
const statusOf = (error: unknown) =>
  Number((error as { status?: number })?.status) || undefined;

/** `true` when there, `false` when not (404), `null` when it can't tell. */
const exists = (request: RestApiRequest, path: string) =>
  request('get', path).then(
    () => true,
    (error) => (statusOf(error) === 404 ? false : null),
  );

/**
 * Which of the services of plone/plone.restapi#2061 the backend has. `clear`
 * is false when an answer was unclear (e.g. the user may not see it), so it
 * shouldn't be kept.
 */
export async function detectRestApi(
  request: RestApiRequest,
): Promise<{ backend: ContentTypesBackend; clear: boolean }> {
  const answers = await Promise.all([
    exists(request, '/@content-types/Plone%20Site'),
    exists(request, '/@behaviors'),
    exists(request, '/@workflows'),
  ]);
  const [contentTypes, behaviors, workflows] = answers.map(Boolean);
  return {
    backend: {
      contentTypes,
      // The ordered behaviors and the preview come with `@behaviors`, on top
      // of `@content-types`.
      behaviors: contentTypes && behaviors,
      workflows: contentTypes && workflows,
    },
    clear: !answers.includes(null),
  };
}

const typePath = (id: string) => `/@content-types/${encodeURIComponent(id)}`;
const dexterityPath = (id: string) =>
  `/@controlpanels/dexterity-types/${encodeURIComponent(id)}`;

/**
 * The content types driver for plone.restapi. It uses `@content-types`,
 * `@behaviors` and `@workflows` (plone/plone.restapi#2061) when `backend`
 * says the site has them (see `detectRestApi`), and
 * `@controlpanels/dexterity-types` otherwise, where every capability is off.
 * Schemas use `@types` either way, which can't reorder fieldsets.
 *
 * plone.restapi changes workflows one type at a time, while the request
 * waits, so a change is a finished job once it answers.
 */
export function createRestApiDriver(
  send: RestApiRequest,
  backend: ContentTypesBackend,
): ContentTypesDriver {
  // Fails with plone.restapi's message, and the status.
  const request: RestApiRequest = <T>(
    method: Parameters<RestApiRequest>[0],
    path: string,
    options?: Parameters<RestApiRequest>[2],
  ) =>
    send<T>(method, path, options).catch((error: unknown) => {
      const status = statusOf(error);
      throw Object.assign(
        new Error(errorMessage(error, `${status ?? ''} ${method} ${path}`)),
        { status },
      );
    });
  const jobs = new Map<string, WorkflowChangeJob>();

  const dexterityType = (id: string) =>
    request<DexterityTypeResponse>('get', dexterityPath(id));

  const dryRun = (type: string, change: WorkflowChangeRequest) =>
    request<WorkflowDryRunResponse>('post', `${typePath(type)}/workflow`, {
      data: toWorkflowChangeBody(change, null, true),
    });

  // The site default, and with it the types that follow it.
  const changeDefault = (
    change: WorkflowChangeRequest,
    current: string | null,
    isDryRun: boolean,
  ) =>
    request<WorkflowDryRunResponse & { types: string[]; changed: number }>(
      'post',
      '/@workflows',
      {
        data: {
          default: change.workflow,
          state_map: change.stateMap?.[current ?? ''] ?? {},
          dry_run: isDryRun,
        },
      },
    );

  const listWorkflows = async () => {
    const listing = await request<{
      default: string | null;
      items: Array<{ id: string }>;
    }>('get', '/@workflows');
    const workflows = await Promise.all(
      listing.items.map(({ id }) =>
        request<WorkflowResponse>(
          'get',
          `/@workflows/${encodeURIComponent(id)}`,
        ),
      ),
    );
    return {
      default: listing.default,
      workflows: workflows.map(toWorkflowInfo),
    };
  };

  const driver: ContentTypesDriver = {
    capabilities: toCapabilities(backend),

    listTypes: async () => {
      if (backend.contentTypes) {
        const { items } = await request<{ items: ContentTypeResponse[] }>(
          'get',
          '/@content-types',
        );
        return items.map(toSummary);
      }
      const { items } = await request<{ items: DexterityTypesItem[] }>(
        'get',
        '/@controlpanels/dexterity-types',
      );
      return items.map(toContentTypeSummary);
    },

    getType: async (id) =>
      backend.contentTypes
        ? toSettings(await request<ContentTypeResponse>('get', typePath(id)))
        : toContentTypeSettings(id, await dexterityType(id)),

    createType: async ({ title, id, description, copyFrom }) => {
      if (backend.contentTypes) {
        return toSummary(
          await request<ContentTypeResponse>('post', '/@content-types', {
            data: { title, id, description, copy_from: copyFrom },
          }),
        );
      }
      if (copyFrom) throw new Error('Copying types is not supported yet');
      const created = await request<{
        '@id': string;
        title?: string;
        description?: string;
      }>('post', '/@controlpanels/dexterity-types', {
        data: { title, id, description },
      });
      return toContentTypeSummary({
        '@id': created['@id'],
        id: id ?? String(created['@id']).split('/').pop() ?? '',
        title: created.title ?? title,
        description: created.description,
        count: 0,
      });
    },

    updateType: async (id, changes) => {
      if (backend.contentTypes) {
        await request('patch', typePath(id), {
          data: toContentTypePatch(changes),
        });
        return;
      }
      // The overview form turns behaviors on and off by name, so it needs
      // all of them to turn the others off.
      const all = changes.behaviors
        ? toBehaviors(await dexterityType(id)).map(({ name }) => name)
        : [];
      const patch = toDexterityTypePatch(changes, all);
      if (!Object.keys(patch).length) {
        throw new Error('Nothing to change that can be saved');
      }
      await request('patch', dexterityPath(id), { data: patch });
    },

    deleteType: async (id) => {
      await request(
        'delete',
        backend.contentTypes ? typePath(id) : dexterityPath(id),
      );
    },

    getSchema: (id) =>
      request<TypeSchema>('get', `/@types/${encodeURIComponent(id)}`),

    saveSchema: async (id, schema) => {
      await request('put', `/@types/${encodeURIComponent(id)}`, {
        data: toTypeSchemaPut(schema),
      });
    },

    previewSchema: (id, behaviors) =>
      request<TypeSchema>('get', `/@types/${encodeURIComponent(id)}`, {
        params: { behaviors: behaviors.join(',') },
      }),

    listFieldTypes: async () => {
      // Plone has about 20 kinds of fields.
      const { items } = await request<{
        items: Array<{ token: string; title?: string | null }>;
      }>('get', '/@vocabularies/Fields', { params: { b_size: '100' } });
      return toFieldTypes(items ?? []);
    },

    listBehaviors: async () => {
      if (backend.behaviors) {
        return (await request<{ items: BehaviorInfo[] }>('get', '/@behaviors'))
          .items;
      }
      // Every type's overview form lists every behavior of the site.
      const { items } = await request<{ items: DexterityTypesItem[] }>(
        'get',
        '/@controlpanels/dexterity-types',
      );
      return items[0] ? toBehaviors(await dexterityType(items[0].id)) : [];
    },

    listWorkflows: async () => (await listWorkflows()).workflows,

    getWorkflowAssignments: async () => {
      const [{ default: fallback }, types] = await Promise.all([
        listWorkflows(),
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
      if (change.siteDefault) {
        const response = await changeDefault(change, null, true);
        return {
          workflow: response.workflow,
          groups: toWorkflowChangeGroups(
            response.types.length
              ? [{ type: response.types[0], response }]
              : [],
          ).map((group) => ({ ...group, types: response.types })),
          unaffected: response.unaffected,
        };
      }
      const runs = await Promise.all(
        (change.types ?? []).map(async (type) => ({
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
      if (change.siteDefault) {
        const { current } = await changeDefault(change, null, true);
        changed = (await changeDefault(change, current, false)).changed ?? 0;
      } else {
        // One type at a time, as the backend changes them.
        for (const type of change.types ?? []) {
          const { current } = await dryRun(type, change);
          const result = await request<{ changed: number }>(
            'post',
            `${typePath(type)}/workflow`,
            { data: toWorkflowChangeBody(change, current, false) },
          );
          changed += result.changed ?? 0;
        }
      }
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

  if (!driver.capabilities.schemaPreview) delete driver.previewSchema;
  if (!driver.capabilities.workflows) {
    delete driver.listWorkflows;
    delete driver.getWorkflowAssignments;
  }
  if (!driver.capabilities.workflowChange) {
    delete driver.previewWorkflowChange;
    delete driver.changeWorkflow;
    delete driver.getWorkflowChangeJob;
  }
  return driver;
}
