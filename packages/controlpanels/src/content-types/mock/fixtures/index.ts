import type {
  BehaviorInfo,
  ContentTypeSettings,
  SiteDefaults,
  TypeSchema,
  WorkflowAssignments,
} from '../../types';
import behaviors from './behaviors.json';
import documentSchema from './schema-Document.json';
import eventSchema from './schema-Event.json';
import { workflows } from './workflows';

// Captured from a Plone 6.2 site with plone.volto (the acceptance test
// backend). Folder is left out: plone.volto replaces folders with folderish
// pages, then completed by hand with what plone.restapi doesn't expose yet:
// the per-type settings, the behavior order, workflows and state counts.
// The fields of each behavior come from scratch types with every behavior
// enabled. `collective.sponsors` stands for an add-on behavior.

export interface MockData {
  types: ContentTypeSettings[];
  schemas: Record<string, TypeSchema>;
  behaviors: BehaviorInfo[];
  workflows: typeof workflows;
  assignments: WorkflowAssignments;
  /** The number of items per type and workflow state. */
  stateCounts: Record<string, Record<string, number>>;
  siteDefaults: SiteDefaults;
}

const PAGE_BEHAVIORS = [
  'plone.dublincore',
  'plone.namefromtitle',
  'plone.shortname',
  'plone.allowdiscussion',
  'plone.excludefromnavigation',
  'plone.relateditems',
  'plone.versioning',
  'plone.locking',
  'plone.tableofcontents',
  'volto.blocks',
  'volto.navtitle',
  'volto.preview_image_link',
];

const settings = (
  type: Pick<ContentTypeSettings, 'id' | 'title' | 'behaviors'> &
    Partial<ContentTypeSettings>,
): ContentTypeSettings => ({
  description: '',
  kind: 'dexterity',
  folderish: false,
  globalAllow: true,
  searchable: true,
  defaultPage: false,
  allowDiscussion: false,
  versioning: 'manual',
  ...type,
});

export const mockData: MockData = {
  types: [
    settings({
      id: 'Plone Site',
      title: 'Plone Site',
      kind: 'site',
      folderish: true,
      allowedContents: { mode: 'all' },
      globalAllow: false,
      versioning: 'off',
      behaviors: ['plone.dublincore', 'volto.blocks'],
    }),
    settings({
      id: 'Collection',
      title: 'Collection',
      description: 'Collection',
      behaviors: [
        'plone.dublincore',
        'plone.namefromtitle',
        'plone.collection',
      ],
      defaultPage: true,
    }),
    settings({
      id: 'Document',
      title: 'Page',
      folderish: true,
      allowedContents: { mode: 'all' },
      defaultPage: true,
      behaviors: PAGE_BEHAVIORS,
    }),
    settings({
      id: 'Link',
      title: 'Link',
      behaviors: ['plone.dublincore', 'plone.namefromtitle'],
      searchable: true,
    }),
    settings({
      id: 'File',
      title: 'File',
      behaviors: ['plone.dublincore', 'plone.namefromfilename'],
      versioning: 'off',
    }),
    settings({
      id: 'Image',
      title: 'Image',
      behaviors: ['plone.dublincore', 'plone.namefromfilename'],
      versioning: 'off',
      searchable: false,
    }),
    settings({
      id: 'News Item',
      title: 'News Item',
      folderish: true,
      allowedContents: { mode: 'all' },
      behaviors: [...PAGE_BEHAVIORS, 'plone.leadimage'],
      versioning: 'automatic',
    }),
    settings({
      id: 'Event',
      title: 'Event',
      description: 'Events can be shown in calendars.',
      folderish: true,
      allowedContents: { mode: 'selected', types: ['Image', 'File', 'Link'] },
      behaviors: [
        'plone.eventbasic',
        'plone.eventrecurrence',
        'plone.eventlocation',
        'plone.eventattendees',
        'plone.eventcontact',
        'plone.dublincore',
        'plone.namefromtitle',
        'plone.shortname',
        'plone.allowdiscussion',
        'plone.excludefromnavigation',
        'plone.relateditems',
        'plone.versioning',
        'plone.locking',
        'plone.textindexer',
        'volto.blocks',
        'volto.navtitle',
        'volto.preview_image_link',
      ],
    }),
    settings({
      id: 'Discussion Item',
      title: 'Comment',
      kind: 'other',
      globalAllow: false,
      searchable: false,
      versioning: 'off',
      behaviors: [],
    }),
  ],
  schemas: {
    Document: documentSchema as TypeSchema,
    Event: eventSchema as TypeSchema,
  },
  behaviors,
  workflows,
  assignments: {
    default: 'simple_publication_workflow',
    types: {
      'Plone Site': { workflow: null, followsDefault: false },
      Collection: {
        workflow: 'simple_publication_workflow',
        followsDefault: true,
      },
      Document: {
        workflow: 'simple_publication_workflow',
        followsDefault: true,
      },
      Link: { workflow: 'simple_publication_workflow', followsDefault: true },
      File: { workflow: null, followsDefault: false },
      Image: { workflow: null, followsDefault: false },
      'News Item': {
        workflow: 'simple_publication_workflow',
        followsDefault: true,
      },
      Event: { workflow: 'simple_publication_workflow', followsDefault: true },
      'Discussion Item': {
        workflow: 'comment_one_state_workflow',
        followsDefault: false,
      },
    },
  },
  stateCounts: {
    'Plone Site': { '': 1 },
    Collection: { published: 2 },
    Document: { private: 1, published: 2 },
  },
  siteDefaults: {
    workflow: 'simple_publication_workflow',
    globalAllow: true,
    versioning: 'manual',
  },
};
