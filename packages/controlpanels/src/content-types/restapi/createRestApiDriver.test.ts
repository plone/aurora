import { describe, expect, it, vi } from 'vitest';
import {
  createRestApiDriver,
  detectRestApi,
  type RestApiRequest,
} from './createRestApiDriver';

const ALL = { contentTypes: true, behaviors: true, workflows: true };
const NONE = { contentTypes: false, behaviors: false, workflows: false };

/** A request that answers from `routes`, by method and path. */
function fakeRequest(routes: Record<string, unknown>) {
  return vi.fn(async (method: string, path: string) => {
    const key = `${method} ${path}`;
    if (!(key in routes)) {
      throw { status: 404, data: { message: `No ${key}` } };
    }
    const answer = routes[key];
    if (answer instanceof Error) throw answer;
    return answer;
  }) as unknown as RestApiRequest & ReturnType<typeof vi.fn>;
}

const overview = {
  '@id': 'http://localhost/@controlpanels/dexterity-types/Event',
  title: 'Event',
  data: { title: 'Event', 'plone.eventbasic': true, 'plone.locking': false },
  schema: {
    properties: {
      'plone.eventbasic': { title: 'Event Basic' },
      'plone.locking': { title: 'Locking' },
    },
    fieldsets: [
      { id: 'behaviors', fields: ['plone.eventbasic', 'plone.locking'] },
    ],
  },
};

describe('detectRestApi', () => {
  it('tells which services the backend has', async () => {
    const request = fakeRequest({
      'get /@content-types/Plone%20Site': {},
      'get /@workflows': {},
    });
    expect(await detectRestApi(request)).toEqual({
      backend: { contentTypes: true, behaviors: false, workflows: true },
      clear: true,
    });
  });

  it("doesn't trust an answer it can't tell", async () => {
    const request = vi.fn(async () => {
      throw { status: 401 };
    }) as unknown as RestApiRequest;
    expect((await detectRestApi(request)).clear).toBe(false);
  });
});

describe('createRestApiDriver', () => {
  it('lists types from @content-types when the backend has it', async () => {
    const request = fakeRequest({
      'get /@content-types': {
        items: [
          {
            '@id': 'x',
            id: 'Event',
            title: 'Event',
            items_total: 2,
            data: { title: 'Event' },
            schema: { fieldsets: [{ id: 'behaviors', fields: [] }] },
          },
        ],
      },
    });
    const driver = createRestApiDriver(request, ALL);
    expect(await driver.listTypes()).toMatchObject([
      { id: 'Event', count: 2, kind: 'dexterity' },
    ]);
    expect(driver.capabilities.workflowChange).toBe(true);
  });

  it('saves behaviors as the overview form on an older backend', async () => {
    const request = fakeRequest({
      'get /@controlpanels/dexterity-types/Event': overview,
      'patch /@controlpanels/dexterity-types/Event': undefined,
    });
    const driver = createRestApiDriver(request, NONE);
    expect(driver.previewSchema).toBeUndefined();
    await driver.updateType('Event', { behaviors: ['plone.locking'] });
    expect(request).toHaveBeenLastCalledWith(
      'patch',
      '/@controlpanels/dexterity-types/Event',
      { data: { 'plone.eventbasic': false, 'plone.locking': true } },
    );
  });

  it('changes a workflow with the state map of the current one', async () => {
    const request = fakeRequest({
      'post /@content-types/Event/workflow': {
        workflow: 'intranet_workflow',
        current: 'simple_publication_workflow',
        states: [{ id: 'published', count: 2, suggested: 'external' }],
        unaffected: 0,
        changed: 2,
      },
    });
    const driver = createRestApiDriver(request, ALL);
    const job = await driver.changeWorkflow!({
      types: ['Event'],
      workflow: 'intranet_workflow',
      stateMap: { simple_publication_workflow: { published: 'internal' } },
    });
    expect(job).toMatchObject({ status: 'done', changed: 2 });
    expect(request).toHaveBeenLastCalledWith(
      'post',
      '/@content-types/Event/workflow',
      {
        data: {
          workflow: 'intranet_workflow',
          state_map: { published: 'internal' },
          dry_run: false,
        },
      },
    );
  });

  it("fails with plone.restapi's message", async () => {
    const request = fakeRequest({
      'delete /@content-types/Event': Object.assign(new Error('Conflict'), {
        status: 409,
        response: { body: { error: { message: 'The type has items' } } },
      }),
    });
    const driver = createRestApiDriver(request, ALL);
    await expect(driver.deleteType('Event')).rejects.toMatchObject({
      message: 'The type has items',
      status: 409,
    });
  });
});
