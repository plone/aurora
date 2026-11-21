import type { WorkflowInfo } from '../../types';

// The workflows Plone ships with. Visibility follows the View permission of
// each state in Products.CMFPlone's workflow definitions.
export const workflows: WorkflowInfo[] = [
  {
    id: 'simple_publication_workflow',
    title: 'Simple Publication Workflow',
    description:
      'Things start out as private, and can either be submitted for review or published directly. The creator can still edit after publishing.',
    initialState: 'private',
    scope: 'content',
    states: [
      { id: 'private', title: 'Private', visibility: 'restricted' },
      { id: 'pending', title: 'Pending review', visibility: 'restricted' },
      { id: 'published', title: 'Published', visibility: 'anyone' },
    ],
    transitions: [
      {
        id: 'submit',
        title: 'Submit for publication',
        from: ['private'],
        to: 'pending',
      },
      {
        id: 'publish',
        title: 'Publish',
        from: ['private', 'pending'],
        to: 'published',
      },
      { id: 'reject', title: 'Send back', from: ['pending'], to: 'private' },
      {
        id: 'retract',
        title: 'Retract',
        from: ['pending', 'published'],
        to: 'private',
      },
    ],
  },
  {
    id: 'intranet_workflow',
    title: 'Intranet/Extranet Workflow',
    description:
      'Workflow for intranets and extranets. Items start as internal drafts, visible to members, and can be published internally or made externally visible.',
    initialState: 'internal',
    scope: 'content',
    states: [
      { id: 'internal', title: 'Internal draft', visibility: 'members' },
      { id: 'pending', title: 'Pending review', visibility: 'members' },
      {
        id: 'internally_published',
        title: 'Internally published',
        visibility: 'members',
      },
      { id: 'external', title: 'Externally visible', visibility: 'anyone' },
      { id: 'private', title: 'Private', visibility: 'restricted' },
    ],
    transitions: [
      {
        id: 'submit',
        title: 'Submit for publication',
        from: ['internal'],
        to: 'pending',
      },
      {
        id: 'publish_internally',
        title: 'Publish internally',
        from: ['internal', 'pending'],
        to: 'internally_published',
      },
      {
        id: 'publish_externally',
        title: 'Publish externally',
        from: ['internally_published', 'pending'],
        to: 'external',
      },
      { id: 'hide', title: 'Make private', from: ['internal'], to: 'private' },
      {
        id: 'show_internally',
        title: 'Show internally',
        from: ['private'],
        to: 'internal',
      },
      {
        id: 'retract',
        title: 'Retract',
        from: ['internally_published', 'external'],
        to: 'internal',
      },
    ],
  },
  {
    id: 'one_state_workflow',
    title: 'Single State Workflow',
    description: 'Every item is published, there are no other states.',
    initialState: 'published',
    scope: 'content',
    states: [{ id: 'published', title: 'Published', visibility: 'anyone' }],
    transitions: [],
  },
  {
    id: 'folder_workflow',
    title: 'Community Workflow for Folders',
    description:
      'Folders start out visible to anyone, and can be published or made private.',
    initialState: 'visible',
    scope: 'content',
    states: [
      { id: 'private', title: 'Private', visibility: 'restricted' },
      { id: 'visible', title: 'Public draft', visibility: 'anyone' },
      { id: 'published', title: 'Published', visibility: 'anyone' },
    ],
    transitions: [
      { id: 'hide', title: 'Make private', from: ['visible'], to: 'private' },
      {
        id: 'show',
        title: 'Promote to draft',
        from: ['private'],
        to: 'visible',
      },
      {
        id: 'publish',
        title: 'Publish',
        from: ['private', 'visible'],
        to: 'published',
      },
      { id: 'retract', title: 'Retract', from: ['published'], to: 'visible' },
    ],
  },
  {
    id: 'comment_review_workflow',
    title: 'Comment Review Workflow',
    description: 'Comments wait for a reviewer before they are published.',
    initialState: 'pending',
    scope: 'comments',
    states: [
      { id: 'pending', title: 'Pending review', visibility: 'restricted' },
      { id: 'published', title: 'Published', visibility: 'anyone' },
    ],
    transitions: [
      { id: 'publish', title: 'Approve', from: ['pending'], to: 'published' },
      {
        id: 'reject',
        title: 'Reject',
        from: ['pending', 'published'],
        to: 'pending',
      },
    ],
  },
  {
    id: 'comment_one_state_workflow',
    title: 'Single State Workflow for comments',
    description: 'Comments are published as soon as they are posted.',
    initialState: 'published',
    scope: 'comments',
    states: [{ id: 'published', title: 'Published', visibility: 'anyone' }],
    transitions: [],
  },
];
