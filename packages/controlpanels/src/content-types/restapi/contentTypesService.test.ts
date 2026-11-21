import { NO_CAPABILITIES } from '../driver';
import {
  toCapabilities,
  toContentTypePatch,
  toSettings,
  toSummary,
  toWorkflowChangeBody,
  toWorkflowChangeGroups,
  toWorkflowInfo,
  type ContentTypeResponse,
  type WorkflowResponse,
} from './contentTypesService';

// Trimmed from `GET @content-types/Event` on plone.restapi#2061.
const event: ContentTypeResponse = {
  '@id': 'http://localhost:55001/plone/@content-types/Event',
  id: 'Event',
  title: 'Event',
  items_total: 3,
  data: {
    title: 'Event',
    description: 'Events can be shown in calendars.',
    global_allow: true,
    allowed_content_types_mode: { token: 'selected', title: 'Selected types' },
    allowed_content_types: [{ token: 'Image', title: 'Image' }],
    searchable: true,
    default_page: true,
    allow_discussion: false,
    versioning: { token: 'automatic', title: 'Automatic' },
    behaviors: [
      { token: 'plone.eventbasic', title: 'Event Basic' },
      { token: 'plone.dublincore', title: 'Dublin Core metadata' },
    ],
  },
  schema: {
    fieldsets: [
      { id: 'general', fields: ['title', 'description'] },
      { id: 'behaviors', fields: ['behaviors'] },
    ],
  },
  workflow: { id: 'simple_publication_workflow', follows_default: true },
};

// Trimmed from `GET @workflows/simple_publication_workflow`.
const simple: WorkflowResponse = {
  id: 'simple_publication_workflow',
  title: 'Simple Publication Workflow',
  description: ' - Initial state is private. ',
  initial_state: 'private',
  states: [
    {
      id: 'pending',
      title: 'Pending review',
      transitions: ['publish', 'reject', 'retract'],
      visibility: 'restricted',
    },
    {
      id: 'private',
      title: 'Private',
      transitions: ['publish', 'submit'],
      visibility: 'restricted',
    },
    {
      id: 'published',
      title: 'Published',
      transitions: ['reject', 'retract'],
      visibility: 'anyone',
    },
  ],
  transitions: [
    { id: 'publish', title: 'Publish', new_state: 'published' },
    { id: 'reject', title: 'Send back', new_state: 'private' },
    { id: 'retract', title: 'Retract', new_state: 'private' },
    { id: 'submit', title: 'Submit for publication', new_state: 'pending' },
  ],
  types: ['Document', 'Event'],
};

describe('toCapabilities', () => {
  it('turns on what the backend has', () => {
    expect(
      toCapabilities({
        contentTypes: false,
        behaviors: false,
        workflows: false,
      }),
    ).toEqual(NO_CAPABILITIES);
    const all = toCapabilities({
      contentTypes: true,
      behaviors: true,
      workflows: true,
    });
    expect(all).toMatchObject({
      versioning: true,
      copyType: true,
      behaviorOrder: true,
      schemaPreview: true,
      workflowChange: true,
      fieldsetOrder: false,
      siteDefaults: false,
    });
  });
});

describe('toSettings and toSummary', () => {
  it('reads the settings, with choices as tokens', () => {
    expect(toSettings(event)).toEqual({
      id: 'Event',
      title: 'Event',
      description: 'Events can be shown in calendars.',
      kind: 'dexterity',
      folderish: true,
      allowedContents: { mode: 'selected', types: ['Image'] },
      globalAllow: true,
      searchable: true,
      defaultPage: true,
      allowDiscussion: false,
      versioning: 'automatic',
      behaviors: ['plone.eventbasic', 'plone.dublincore'],
      workflow: {
        workflow: 'simple_publication_workflow',
        followsDefault: true,
      },
    });
    expect(toSummary(event)).toMatchObject({
      count: 3,
      versioning: 'automatic',
      kind: 'dexterity',
    });
  });

  it('tells the site and types without behaviors apart', () => {
    expect(toSummary({ ...event, id: 'Plone Site' }).kind).toBe('site');
    expect(
      toSummary({
        ...event,
        id: 'Discussion Item',
        schema: { fieldsets: [{ id: 'general', fields: [] }] },
      }).kind,
    ).toBe('other');
  });
});

describe('toContentTypePatch', () => {
  it('only sends what changed, in the backend names', () => {
    expect(
      toContentTypePatch({
        globalAllow: false,
        defaultPage: true,
        allowedContents: { mode: 'selected', types: ['File'] },
        behaviors: ['plone.dublincore'],
      }),
    ).toEqual({
      global_allow: false,
      default_page: true,
      allowed_content_types_mode: 'selected',
      allowed_content_types: ['File'],
      behaviors: ['plone.dublincore'],
    });
    expect(toContentTypePatch({ allowedContents: { mode: 'none' } })).toEqual({
      allowed_content_types_mode: 'none',
    });
  });
});

describe('toWorkflowInfo', () => {
  it('orders the states the way items go through them', () => {
    const info = toWorkflowInfo(simple);
    expect(info.states.map((state) => state.id)).toEqual([
      'private',
      'pending',
      'published',
    ]);
    expect(info.description).toBe('- Initial state is private.');
    expect(info.scope).toBe('content');
    expect(info.transitions.find((entry) => entry.id === 'retract')).toEqual({
      id: 'retract',
      title: 'Retract',
      from: ['pending', 'published'],
      to: 'private',
    });
    expect(
      toWorkflowInfo({ ...simple, id: 'x', types: ['Discussion Item'] }).scope,
    ).toBe('comments');
  });
});

describe('workflow changes', () => {
  it('sends the state map of the current workflow', () => {
    const request = {
      types: ['Event'],
      workflow: 'intranet_workflow',
      stateMap: { simple_publication_workflow: { published: 'external' } },
    };
    expect(
      toWorkflowChangeBody(request, 'simple_publication_workflow', false),
    ).toEqual({
      workflow: 'intranet_workflow',
      state_map: { published: 'external' },
      dry_run: false,
    });
    expect(
      toWorkflowChangeBody(
        { ...request, followDefault: true },
        'intranet_workflow',
        true,
      ),
    ).toEqual({ follows_default: true, state_map: {}, dry_run: true });
  });

  it('groups the dry runs of types that share a workflow', () => {
    const response = {
      workflow: 'intranet_workflow',
      current: 'simple_publication_workflow',
      states: [{ id: 'published', count: 2, suggested: 'external' }],
      unaffected: 0,
    };
    expect(
      toWorkflowChangeGroups([
        { type: 'Document', response },
        {
          type: 'Event',
          response: {
            ...response,
            states: [{ ...response.states[0], count: 1 }],
          },
        },
      ]),
    ).toEqual([
      {
        workflow: 'simple_publication_workflow',
        types: ['Document', 'Event'],
        states: [{ state: 'published', count: 3, suggested: 'external' }],
      },
    ]);
  });
});
