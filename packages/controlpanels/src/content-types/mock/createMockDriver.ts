import type { ContentTypesCapabilities, ContentTypesDriver } from '../driver';
import type {
  ContentTypeSettings,
  ContentTypeSummary,
  TypeSchema,
  WorkflowChangeGroup,
  WorkflowChangeJob,
  WorkflowChangeRequest,
} from '../types';
import { estimateFormPreview } from '../behaviorEditing';
import { DEFAULT_BEHAVIOR_METADATA } from '../behaviorMetadata';
import { toShortName } from '../shortName';
import { suggestStateMapping } from '../workflow/suggestStateMapping';
import { mockData } from './fixtures';
import type { MockData } from './fixtures';

export interface MockDriverOptions {
  /** Replaces parts of the default data. */
  data?: Partial<MockData>;
  /** Turns capabilities off, to see the screens against a basic backend. */
  capabilities?: Partial<ContentTypesCapabilities>;
  /** Milliseconds every call waits before answering. */
  latency?: number;
  /** How many `getWorkflowChangeJob` calls a workflow change takes to finish. */
  jobSteps?: number;
}

const clone = <T>(value: T): T => structuredClone(value);

function emptySchema(title: string): TypeSchema {
  return {
    title,
    type: 'object',
    fieldsets: [{ id: 'default', title: 'Default', fields: [] }],
    properties: {},
    required: [],
  };
}

/**
 * A driver that keeps its data in memory, seeded with fixtures from a real
 * site. Every capability is on by default. For stories, tests and building
 * screens before the backend supports them.
 */
export function createMockDriver(
  options: MockDriverOptions = {},
): ContentTypesDriver {
  const data: MockData = clone({ ...mockData, ...options.data });
  const jobSteps = options.jobSteps ?? 3;
  const jobs = new Map<
    string,
    { job: WorkflowChangeJob; request: WorkflowChangeRequest; step: number }
  >();

  const capabilities: ContentTypesCapabilities = {
    globalAllow: true,
    searchable: true,
    defaultPage: true,
    allowDiscussion: true,
    versioning: true,
    behaviorOrder: true,
    behaviorDetails: true,
    schemaPreview: true,
    fieldsetOrder: true,
    workflows: true,
    workflowChange: true,
    siteDefaults: true,
    copyType: true,
    importExport: true,
    ...options.capabilities,
  };

  const delay = <T>(value: T): Promise<T> =>
    new Promise((resolve) =>
      setTimeout(() => resolve(value), options.latency ?? 0),
    );
  // Answers with a copy, so callers can't change the stored data.
  const wait = <T>(value: T): Promise<T> => delay(clone(value));
  const fail = (message: string): Promise<never> =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), options.latency ?? 0),
    );

  const findType = (id: string) => data.types.find((type) => type.id === id);

  // Every field the fixtures describe, to fill in the fields of a behavior
  // a type didn't have.
  const knownFields = Object.assign(
    {},
    ...Object.values(data.schemas).map((schema) => schema.properties),
  ) as TypeSchema['properties'];

  /**
   * A stand-in for the backend's dry run: the type's schema with these
   * behaviors, from what each behavior adds. It doesn't follow ordering hints.
   */
  const schemaWith = (id: string, behaviors: string[]): TypeSchema => {
    const type = findType(id)!;
    const { schema } = estimateFormPreview(behaviors, {
      behaviors: data.behaviors,
      schema: data.schemas[id] ?? emptySchema(type.title),
      saved: type.behaviors,
      metadata: DEFAULT_BEHAVIOR_METADATA,
    });
    for (const [name, field] of Object.entries(schema.properties)) {
      if (knownFields[name] && field.title === name) {
        schema.properties[name] = { ...knownFields[name] };
      }
    }
    return schema;
  };
  const findWorkflow = (id: string | null) =>
    data.workflows.find((workflow) => workflow.id === id);
  const assignment = (id: string) =>
    data.assignments.types[id] ?? {
      workflow: data.assignments.default,
      followsDefault: true,
    };
  const count = (id: string) =>
    Object.values(data.stateCounts[id] ?? {}).reduce((a, b) => a + b, 0);

  const summary = (type: ContentTypeSettings): ContentTypeSummary => ({
    id: type.id,
    title: type.title,
    description: type.description,
    kind: type.kind,
    count: count(type.id),
    ...(capabilities.globalAllow && { globalAllow: type.globalAllow }),
    ...(capabilities.workflows && { workflow: assignment(type.id) }),
    ...(capabilities.versioning && { versioning: type.versioning }),
  });

  const visibleSettings = (type: ContentTypeSettings): ContentTypeSettings => {
    const result: ContentTypeSettings = { ...type };
    if (!capabilities.globalAllow) delete result.globalAllow;
    if (!capabilities.searchable) delete result.searchable;
    if (!capabilities.defaultPage) delete result.defaultPage;
    if (!capabilities.allowDiscussion) delete result.allowDiscussion;
    if (!capabilities.versioning) delete result.versioning;
    if (capabilities.workflows) result.workflow = assignment(type.id);
    else delete result.workflow;
    return result;
  };

  const affectedTypes = (request: WorkflowChangeRequest): string[] =>
    request.siteDefault
      ? data.types
          .filter((type) => assignment(type.id).followsDefault)
          .map((type) => type.id)
      : (request.types ?? []);

  const groupsFor = (request: WorkflowChangeRequest): WorkflowChangeGroup[] => {
    const target = findWorkflow(request.workflow);
    const groups = new Map<string | null, string[]>();
    for (const id of affectedTypes(request)) {
      const current = assignment(id).workflow;
      groups.set(current, [...(groups.get(current) ?? []), id]);
    }
    return [...groups].map(([workflow, types]) => {
      const source = findWorkflow(workflow);
      const suggestions =
        source && target ? suggestStateMapping(source, target) : {};
      const states = source?.states.map((state) => state.id) ?? [''];
      return {
        workflow,
        types,
        states: states.map((state) => ({
          state,
          count: types.reduce(
            (sum, id) => sum + (data.stateCounts[id]?.[state] ?? 0),
            0,
          ),
          suggested: target
            ? (suggestions[state] ?? target.initialState)
            : null,
        })),
      };
    });
  };

  const applyWorkflowChange = (request: WorkflowChangeRequest) => {
    const target = findWorkflow(request.workflow);
    for (const group of groupsFor(request)) {
      const map = request.stateMap?.[group.workflow ?? ''] ?? {};
      for (const id of group.types) {
        const counts: Record<string, number> = {};
        for (const [state, n] of Object.entries(data.stateCounts[id] ?? {})) {
          const next = target
            ? (map[state] ??
              group.states.find((entry) => entry.state === state)?.suggested ??
              target.initialState)
            : '';
          counts[next] = (counts[next] ?? 0) + n;
        }
        if (data.stateCounts[id]) data.stateCounts[id] = counts;
      }
    }
    if (request.siteDefault) {
      data.assignments.default = request.workflow;
      data.siteDefaults.workflow = request.workflow;
      for (const id of affectedTypes(request)) {
        data.assignments.types[id] = {
          workflow: request.workflow,
          followsDefault: true,
        };
      }
    } else {
      for (const id of request.types ?? []) {
        data.assignments.types[id] = {
          workflow: request.workflow,
          followsDefault: !!request.followDefault,
        };
      }
    }
  };

  const driver: ContentTypesDriver = {
    capabilities,

    listTypes: () => wait(data.types.map(summary)),

    getType: (id) => {
      const type = findType(id);
      return type ? wait(visibleSettings(type)) : fail(`No type "${id}"`);
    },

    createType: ({ title, id, description, copyFrom }) => {
      const newId = id || toShortName(title);
      if (!newId || findType(newId)) {
        return fail(`A type with the short name "${newId}" already exists`);
      }
      const source = copyFrom ? findType(copyFrom) : undefined;
      if (copyFrom && !source) return fail(`No type "${copyFrom}"`);
      const type: ContentTypeSettings = source
        ? { ...clone(source), id: newId, title, description: description ?? '' }
        : {
            id: newId,
            title,
            description: description ?? '',
            kind: 'dexterity',
            folderish: true,
            allowedContents: { mode: 'all' },
            globalAllow: data.siteDefaults.globalAllow,
            searchable: true,
            defaultPage: false,
            allowDiscussion: false,
            versioning: data.siteDefaults.versioning,
            behaviors: ['plone.dublincore', 'plone.namefromtitle'],
          };
      data.types.push(type);
      data.schemas[newId] = source
        ? clone(data.schemas[source.id] ?? emptySchema(title))
        : emptySchema(title);
      if (source) data.assignments.types[newId] = assignment(source.id);
      return wait(summary(type));
    },

    updateType: (id, changes) => {
      const type = findType(id);
      if (!type) return fail(`No type "${id}"`);
      if (changes.behaviors && data.schemas[id]) {
        data.schemas[id] = schemaWith(id, changes.behaviors);
      }
      Object.assign(type, changes);
      return wait(undefined);
    },

    deleteType: (id) => {
      const type = findType(id);
      if (!type) return fail(`No type "${id}"`);
      if (type.kind === 'site') return fail(`"${id}" can't be deleted`);
      if (count(id) > 0) {
        return fail(`"${id}" can't be deleted while it has items`);
      }
      data.types = data.types.filter((entry) => entry.id !== id);
      delete data.schemas[id];
      delete data.assignments.types[id];
      return wait(undefined);
    },

    getSchema: (id) =>
      findType(id)
        ? wait(data.schemas[id] ?? emptySchema(findType(id)!.title))
        : fail(`No type "${id}"`),

    saveSchema: (id, schema) => {
      if (!findType(id)) return fail(`No type "${id}"`);
      const saved = clone(schema);
      // Like plone.restapi, keep the stored fieldset order, and add new
      // fieldsets at the end.
      const stored = data.schemas[id]?.fieldsets.map((fieldset) => fieldset.id);
      if (!capabilities.fieldsetOrder && stored) {
        const position = (fieldset: { id: string }) => {
          const index = stored.indexOf(fieldset.id);
          return index === -1 ? stored.length : index;
        };
        saved.fieldsets.sort((a, b) => position(a) - position(b));
      }
      data.schemas[id] = saved;
      return wait(undefined);
    },

    previewSchema: (id, behaviors) => {
      const type = findType(id);
      if (!type) return fail(`No type "${id}"`);
      return wait(schemaWith(id, behaviors));
    },

    listFieldTypes: () => wait(data.fieldTypes),

    listBehaviors: () =>
      wait(
        capabilities.behaviorDetails
          ? data.behaviors
          : data.behaviors.map(({ fieldsets, ...behavior }) => behavior),
      ),

    listWorkflows: () => wait(data.workflows),

    getWorkflowAssignments: () =>
      wait({
        default: data.assignments.default,
        types: Object.fromEntries(
          data.types.map((type) => [type.id, assignment(type.id)]),
        ),
      }),

    previewWorkflowChange: (request) => {
      if (request.workflow !== null && !findWorkflow(request.workflow)) {
        return fail(`No workflow "${request.workflow}"`);
      }
      return wait({
        workflow: request.workflow,
        groups: groupsFor(request),
        unaffected: 0,
      });
    },

    changeWorkflow: (request) => {
      if (request.workflow !== null && !findWorkflow(request.workflow)) {
        return fail(`No workflow "${request.workflow}"`);
      }
      const id = `job-${jobs.size + 1}`;
      const job: WorkflowChangeJob = {
        id,
        status: 'running',
        progress: 0,
        changed: 0,
      };
      jobs.set(id, { job, request, step: 0 });
      return wait(job);
    },

    getWorkflowChangeJob: (id) => {
      const entry = jobs.get(id);
      if (!entry) return fail(`No job "${id}"`);
      if (entry.job.status === 'running') {
        entry.step += 1;
        const total = affectedTypes(entry.request).reduce(
          (sum, type) => sum + count(type),
          0,
        );
        entry.job.progress = Math.min(entry.step / jobSteps, 1);
        entry.job.changed = Math.round(total * entry.job.progress);
        if (entry.step >= jobSteps) {
          applyWorkflowChange(entry.request);
          entry.job.status = 'done';
        }
      }
      return wait(entry.job);
    },

    getSiteDefaults: () => wait(data.siteDefaults),

    updateSiteDefaults: (defaults) => {
      const { workflow, ...rest } = defaults;
      // The default workflow changes through `changeWorkflow`, with a mapping.
      if (workflow !== undefined && workflow !== data.siteDefaults.workflow) {
        return fail('Change the default workflow with changeWorkflow');
      }
      Object.assign(data.siteDefaults, rest);
      return wait(undefined);
    },

    exportTypes: (ids) => {
      const types = data.types.filter((type) => ids.includes(type.id));
      const payload = types.map((type) => ({
        settings: type,
        schema: data.schemas[type.id],
      }));
      return delay(
        new Blob([JSON.stringify(payload, null, 2)], {
          type: 'application/json',
        }),
      );
    },

    importTypes: async (file) => {
      let payload: Array<{
        settings: ContentTypeSettings;
        schema?: TypeSchema;
      }>;
      try {
        payload = JSON.parse(await file.text());
      } catch {
        return fail('The file is not a type export');
      }
      for (const { settings, schema } of payload) {
        data.types = data.types.filter((type) => type.id !== settings.id);
        data.types.push(settings);
        if (schema) data.schemas[settings.id] = schema;
      }
      return wait(payload.map(({ settings }) => summary(settings)));
    },
  };

  // Like a real driver, only offer the optional methods whose capability is on.
  const optional: Array<[keyof ContentTypesCapabilities, OptionalMethod[]]> = [
    ['schemaPreview', ['previewSchema']],
    ['workflows', ['listWorkflows', 'getWorkflowAssignments']],
    [
      'workflowChange',
      ['previewWorkflowChange', 'changeWorkflow', 'getWorkflowChangeJob'],
    ],
    ['siteDefaults', ['getSiteDefaults', 'updateSiteDefaults']],
    ['importExport', ['exportTypes', 'importTypes']],
  ];
  for (const [capability, methods] of optional) {
    if (!capabilities[capability]) {
      for (const method of methods) delete driver[method];
    }
  }
  return driver;
}

type OptionalMethod = {
  [K in keyof ContentTypesDriver]-?: undefined extends ContentTypesDriver[K]
    ? K
    : never;
}[keyof ContentTypesDriver];
