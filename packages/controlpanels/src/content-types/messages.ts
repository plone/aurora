import { defineMessages } from '../provider/messages';

export const messages = defineMessages({
  title: {
    id: 'controlpanels.contentTypes.title',
    defaultMessage: 'Content types',
  },
  description: {
    id: 'controlpanels.contentTypes.description',
    defaultMessage:
      'Choose what editors can create, how it is published, and which fields it has.',
  },
  addType: {
    id: 'controlpanels.contentTypes.addType',
    defaultMessage: 'Add content type',
  },
  filter: {
    id: 'controlpanels.contentTypes.filter',
    defaultMessage: 'Filter types',
  },
  show: {
    id: 'controlpanels.contentTypes.show',
    defaultMessage: 'Show',
  },
  showAll: {
    id: 'controlpanels.contentTypes.showAll',
    defaultMessage: 'All {count}',
  },
  showNotAddable: {
    id: 'controlpanels.contentTypes.showNotAddable',
    defaultMessage: 'Not addable {count}',
  },
  columnType: {
    id: 'controlpanels.contentTypes.columnType',
    defaultMessage: 'Type',
  },
  columnWorkflow: {
    id: 'controlpanels.contentTypes.columnWorkflow',
    defaultMessage: 'Workflow',
  },
  columnAddable: {
    id: 'controlpanels.contentTypes.columnAddable',
    defaultMessage: 'Addable',
  },
  columnVersioning: {
    id: 'controlpanels.contentTypes.columnVersioning',
    defaultMessage: 'Versioning',
  },
  columnItems: {
    id: 'controlpanels.contentTypes.columnItems',
    defaultMessage: 'Items',
  },
  columnActions: {
    id: 'controlpanels.contentTypes.columnActions',
    defaultMessage: 'Actions',
  },
  noWorkflow: {
    id: 'controlpanels.contentTypes.noWorkflow',
    defaultMessage: 'No workflow',
  },
  siteDefault: {
    id: 'controlpanels.contentTypes.siteDefault',
    defaultMessage: 'site default',
  },
  addable: {
    id: 'controlpanels.contentTypes.addable',
    defaultMessage: '{title}: globally addable',
  },
  versioningOff: {
    id: 'controlpanels.contentTypes.versioningOff',
    defaultMessage: 'None',
  },
  versioningManual: {
    id: 'controlpanels.contentTypes.versioningManual',
    defaultMessage: 'Manual',
  },
  versioningAutomatic: {
    id: 'controlpanels.contentTypes.versioningAutomatic',
    defaultMessage: 'Automatic',
  },
  settingsOnly: {
    id: 'controlpanels.contentTypes.settingsOnly',
    defaultMessage: 'Settings only',
  },
  actionsFor: {
    id: 'controlpanels.contentTypes.actionsFor',
    defaultMessage: 'Actions for {title}',
  },
  tabSettings: {
    id: 'controlpanels.contentTypes.tabSettings',
    defaultMessage: 'Settings',
  },
  tabWorkflow: {
    id: 'controlpanels.contentTypes.tabWorkflow',
    defaultMessage: 'Workflow',
  },
  tabFields: {
    id: 'controlpanels.contentTypes.tabFields',
    defaultMessage: 'Fields',
  },
  tabBehaviors: {
    id: 'controlpanels.contentTypes.tabBehaviors',
    defaultMessage: 'Behaviors',
  },
  tabLayout: {
    id: 'controlpanels.contentTypes.tabLayout',
    defaultMessage: 'Layout',
  },
  copy: {
    id: 'controlpanels.contentTypes.copy',
    defaultMessage: 'Copy…',
  },
  delete: {
    id: 'controlpanels.contentTypes.delete',
    defaultMessage: 'Delete…',
  },
  selected: {
    id: 'controlpanels.contentTypes.selected',
    defaultMessage: '{count} selected',
  },
  selection: {
    id: 'controlpanels.contentTypes.selection',
    defaultMessage: 'Selected types',
  },
  loading: {
    id: 'controlpanels.contentTypes.loading',
    defaultMessage: 'Loading content types…',
  },
  loadError: {
    id: 'controlpanels.contentTypes.loadError',
    defaultMessage: "The content types couldn't be loaded.",
  },
  retry: {
    id: 'controlpanels.contentTypes.retry',
    defaultMessage: 'Try again',
  },
  noMatches: {
    id: 'controlpanels.contentTypes.noMatches',
    defaultMessage: 'No types match.',
  },
  updated: {
    id: 'controlpanels.contentTypes.updated',
    defaultMessage: '{title} saved',
  },
  updateError: {
    id: 'controlpanels.contentTypes.updateError',
    defaultMessage: "{title} couldn't be saved",
  },
  siteDefaults: {
    id: 'controlpanels.contentTypes.siteDefaults',
    defaultMessage: 'Site defaults',
  },
  defaultWorkflow: {
    id: 'controlpanels.contentTypes.defaultWorkflow',
    defaultMessage: 'Workflow: {workflow}',
  },
  newTypesStart: {
    id: 'controlpanels.contentTypes.newTypesStart',
    defaultMessage: 'New types start {addable}, with {versioning} versioning',
  },
  globallyAddable: {
    id: 'controlpanels.contentTypes.globallyAddable',
    defaultMessage: 'globally addable',
  },
  notGloballyAddable: {
    id: 'controlpanels.contentTypes.notGloballyAddable',
    defaultMessage: 'not globally addable',
  },

  // Add dialog
  addTitle: {
    id: 'controlpanels.contentTypes.addTitle',
    defaultMessage: 'Add content type',
  },
  addDescription: {
    id: 'controlpanels.contentTypes.addDescription',
    defaultMessage: 'You can add fields and behaviors after creating it.',
  },
  name: {
    id: 'controlpanels.contentTypes.name',
    defaultMessage: 'Name',
  },
  shortName: {
    id: 'controlpanels.contentTypes.shortName',
    defaultMessage: 'Short name',
  },
  shortNameHelp: {
    id: 'controlpanels.contentTypes.shortNameHelp',
    defaultMessage:
      "Filled in from the name. Used in URLs and code, and can't be changed later.",
  },
  shortNameInvalid: {
    id: 'controlpanels.contentTypes.shortNameInvalid',
    defaultMessage:
      'Use lowercase letters, digits and underscores, starting with a letter.',
  },
  shortNameTaken: {
    id: 'controlpanels.contentTypes.shortNameTaken',
    defaultMessage: 'A type with this short name already exists.',
  },
  typeDescription: {
    id: 'controlpanels.contentTypes.typeDescription',
    defaultMessage: 'Description',
  },
  startFrom: {
    id: 'controlpanels.contentTypes.startFrom',
    defaultMessage: 'Start from',
  },
  startBlank: {
    id: 'controlpanels.contentTypes.startBlank',
    defaultMessage: 'Blank type',
  },
  startBlankHelp: {
    id: 'controlpanels.contentTypes.startBlankHelp',
    defaultMessage: 'Title and description only.',
  },
  startCopy: {
    id: 'controlpanels.contentTypes.startCopy',
    defaultMessage: 'A copy of an existing type',
  },
  startCopyHelp: {
    id: 'controlpanels.contentTypes.startCopyHelp',
    defaultMessage: 'Copies fields, behaviors, layout and settings.',
  },
  typeToCopy: {
    id: 'controlpanels.contentTypes.typeToCopy',
    defaultMessage: 'Type to copy',
  },
  cancel: {
    id: 'controlpanels.contentTypes.cancel',
    defaultMessage: 'Cancel',
  },
  create: {
    id: 'controlpanels.contentTypes.create',
    defaultMessage: 'Create and add fields',
  },
  created: {
    id: 'controlpanels.contentTypes.created',
    defaultMessage: '{title} created',
  },
  createError: {
    id: 'controlpanels.contentTypes.createError',
    defaultMessage: "The type couldn't be created",
  },

  // Delete dialog
  deleteTitle: {
    id: 'controlpanels.contentTypes.deleteTitle',
    defaultMessage: 'Delete {title}?',
  },
  deleteManyTitle: {
    id: 'controlpanels.contentTypes.deleteManyTitle',
    defaultMessage: 'Delete {count} types?',
  },
  deleteExplanation: {
    id: 'controlpanels.contentTypes.deleteExplanation',
    defaultMessage:
      'Their fields, behaviors and layout are deleted with them. This can’t be undone.',
  },
  deleteBlocked: {
    id: 'controlpanels.contentTypes.deleteBlocked',
    defaultMessage:
      "Types that still have items can't be deleted. Delete or move their items first:",
  },
  deleteBlockedItem: {
    id: 'controlpanels.contentTypes.deleteBlockedItem',
    defaultMessage: '{title}: {count} items',
  },
  deleteConfirm: {
    id: 'controlpanels.contentTypes.deleteConfirm',
    defaultMessage: 'Delete',
  },
  deleteConfirmMany: {
    id: 'controlpanels.contentTypes.deleteConfirmMany',
    defaultMessage: 'Delete {count} types',
  },
  close: {
    id: 'controlpanels.contentTypes.close',
    defaultMessage: 'Close',
  },
  deleted: {
    id: 'controlpanels.contentTypes.deleted',
    defaultMessage: '{title} deleted',
  },
  deletedMany: {
    id: 'controlpanels.contentTypes.deletedMany',
    defaultMessage: '{count} types deleted',
  },
  deleteError: {
    id: 'controlpanels.contentTypes.deleteError',
    defaultMessage: "{title} couldn't be deleted",
  },
});
