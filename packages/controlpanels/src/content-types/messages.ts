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
    defaultMessage: 'All {{count}}',
  },
  showNotAddable: {
    id: 'controlpanels.contentTypes.showNotAddable',
    defaultMessage: 'Not addable {{count}}',
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
    defaultMessage: '{{title}}: globally addable',
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
    defaultMessage: 'Actions for {{title}}',
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
    defaultMessage: '{{count}} selected',
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
    defaultMessage: '{{title}} saved',
  },
  updateError: {
    id: 'controlpanels.contentTypes.updateError',
    defaultMessage: "{{title}} couldn't be saved",
  },
  siteDefaults: {
    id: 'controlpanels.contentTypes.siteDefaults',
    defaultMessage: 'Site defaults',
  },
  defaultWorkflow: {
    id: 'controlpanels.contentTypes.defaultWorkflow',
    defaultMessage: 'Workflow: {{workflow}}',
  },
  newTypesStart: {
    id: 'controlpanels.contentTypes.newTypesStart',
    defaultMessage:
      'New types start {{addable}}, with {{versioning}} versioning',
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
    defaultMessage: '{{title}} created',
  },
  createError: {
    id: 'controlpanels.contentTypes.createError',
    defaultMessage: "The type couldn't be created",
  },

  // Delete dialog
  deleteTitle: {
    id: 'controlpanels.contentTypes.deleteTitle',
    defaultMessage: 'Delete {{title}}?',
  },
  deleteManyTitle: {
    id: 'controlpanels.contentTypes.deleteManyTitle',
    defaultMessage: 'Delete {{count}} types?',
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
    defaultMessage: '{{title}}: {{count}} items',
  },
  deleteConfirm: {
    id: 'controlpanels.contentTypes.deleteConfirm',
    defaultMessage: 'Delete',
  },
  deleteConfirmMany: {
    id: 'controlpanels.contentTypes.deleteConfirmMany',
    defaultMessage: 'Delete {{count}} types',
  },
  close: {
    id: 'controlpanels.contentTypes.close',
    defaultMessage: 'Close',
  },
  deleted: {
    id: 'controlpanels.contentTypes.deleted',
    defaultMessage: '{{title}} deleted',
  },
  deletedMany: {
    id: 'controlpanels.contentTypes.deletedMany',
    defaultMessage: '{{count}} types deleted',
  },
  deleteError: {
    id: 'controlpanels.contentTypes.deleteError',
    defaultMessage: "{{title}} couldn't be deleted",
  },

  // Type page
  typeLoadError: {
    id: 'controlpanels.contentTypes.typeLoadError',
    defaultMessage: "This type couldn't be loaded.",
  },
  loadingType: {
    id: 'controlpanels.contentTypes.loadingType',
    defaultMessage: 'Loading…',
  },
  tabs: {
    id: 'controlpanels.contentTypes.tabs',
    defaultMessage: 'Type settings',
  },
  unsavedChanges: {
    id: 'controlpanels.contentTypes.unsavedChanges',
    defaultMessage: 'Unsaved changes',
  },
  unsavedChangesIn: {
    id: 'controlpanels.contentTypes.unsavedChangesIn',
    defaultMessage: 'Unsaved changes in {{tabs}}',
  },
  discard: {
    id: 'controlpanels.contentTypes.discard',
    defaultMessage: 'Discard',
  },
  save: {
    id: 'controlpanels.contentTypes.save',
    defaultMessage: 'Save',
  },
  saveError: {
    id: 'controlpanels.contentTypes.saveError',
    defaultMessage: "{{title}} couldn't be saved",
  },
  leaveTitle: {
    id: 'controlpanels.contentTypes.leaveTitle',
    defaultMessage: 'Leave without saving?',
  },
  leaveDescription: {
    id: 'controlpanels.contentTypes.leaveDescription',
    defaultMessage: 'Your changes to {{title}} will be lost.',
  },
  keepEditing: {
    id: 'controlpanels.contentTypes.keepEditing',
    defaultMessage: 'Keep editing',
  },
  discardChanges: {
    id: 'controlpanels.contentTypes.discardChanges',
    defaultMessage: 'Discard changes',
  },
  items: {
    id: 'controlpanels.contentTypes.items',
    defaultMessage: '{{count}} items',
  },
  comingLater: {
    id: 'controlpanels.contentTypes.comingLater',
    defaultMessage: 'This tab is coming soon.',
  },
  notADexterityType: {
    id: 'controlpanels.contentTypes.notADexterityType',
    defaultMessage:
      "{{title}} isn't a Dexterity type, so it has no fields, behaviors or layout.",
  },

  // Settings tab
  general: {
    id: 'controlpanels.contentTypes.general',
    defaultMessage: 'General',
  },
  generalHelp: {
    id: 'controlpanels.contentTypes.generalHelp',
    defaultMessage: 'Shown to editors in the Add menu.',
  },
  whereAdded: {
    id: 'controlpanels.contentTypes.whereAdded',
    defaultMessage: 'Where it can be added',
  },
  globalAllow: {
    id: 'controlpanels.contentTypes.globalAllow',
    defaultMessage: 'Globally addable',
  },
  notGlobalAllow: {
    id: 'controlpanels.contentTypes.notGlobalAllow',
    defaultMessage: 'Not globally addable',
  },
  globalAllowHelp: {
    id: 'controlpanels.contentTypes.globalAllowHelp',
    defaultMessage:
      "Editors can add it in any folder that doesn't restrict its contents. When off, it can only be added where a folder allows it explicitly.",
  },
  contents: {
    id: 'controlpanels.contentTypes.contents',
    defaultMessage: 'Contents',
  },
  contentsHelp: {
    id: 'controlpanels.contentTypes.contentsHelp',
    defaultMessage: 'Items of this type can contain other items.',
  },
  allowedInside: {
    id: 'controlpanels.contentTypes.allowedInside',
    defaultMessage: 'Allowed inside',
  },
  allowAll: {
    id: 'controlpanels.contentTypes.allowAll',
    defaultMessage: 'All types',
  },
  allowSelected: {
    id: 'controlpanels.contentTypes.allowSelected',
    defaultMessage: 'Only selected types',
  },
  allowNone: {
    id: 'controlpanels.contentTypes.allowNone',
    defaultMessage: 'Nothing',
  },
  allowedTypes: {
    id: 'controlpanels.contentTypes.allowedTypes',
    defaultMessage: 'Allowed types',
  },
  addAllowedType: {
    id: 'controlpanels.contentTypes.addAllowedType',
    defaultMessage: 'Type to add a type',
  },
  visibility: {
    id: 'controlpanels.contentTypes.visibility',
    defaultMessage: 'Visibility',
  },
  searchable: {
    id: 'controlpanels.contentTypes.searchable',
    defaultMessage: 'Show in search results',
  },
  searchableHelp: {
    id: 'controlpanels.contentTypes.searchableHelp',
    defaultMessage:
      'Turn off for helper types that should never appear in site search.',
  },
  defaultPage: {
    id: 'controlpanels.contentTypes.defaultPage',
    defaultMessage: "Can be used as a folder's default page",
  },
  defaultPageHelp: {
    id: 'controlpanels.contentTypes.defaultPageHelp',
    defaultMessage:
      'Lets editors pick an item of this type as the page a folder shows.',
  },
  comments: {
    id: 'controlpanels.contentTypes.comments',
    defaultMessage: 'Comments',
  },
  allowDiscussion: {
    id: 'controlpanels.contentTypes.allowDiscussion',
    defaultMessage: 'Allow comments',
  },
  versioning: {
    id: 'controlpanels.contentTypes.versioning',
    defaultMessage: 'Versioning',
  },
  versioningHelp: {
    id: 'controlpanels.contentTypes.versioningHelp',
    defaultMessage: 'Versions let editors compare and revert changes.',
  },
  versioningOffHelp: {
    id: 'controlpanels.contentTypes.versioningOffHelp',
    defaultMessage: 'Only the current state is kept.',
  },
  versioningManualHelp: {
    id: 'controlpanels.contentTypes.versioningManualHelp',
    defaultMessage: 'Editors save a version when they choose to.',
  },
  versioningAutomaticHelp: {
    id: 'controlpanels.contentTypes.versioningAutomaticHelp',
    defaultMessage: 'Every save creates a version.',
  },
  moreSettingsLater: {
    id: 'controlpanels.contentTypes.moreSettingsLater',
    defaultMessage:
      'Addability, search, default page, comments and versioning settings need a newer version of the content API.',
  },
  addField: {
    id: 'controlpanels.contentTypes.addField',
    defaultMessage: 'Add field',
  },
  addFieldset: {
    id: 'controlpanels.contentTypes.addFieldset',
    defaultMessage: 'Add fieldset',
  },
  fieldsets: {
    id: 'controlpanels.contentTypes.fieldsets',
    defaultMessage: 'Fieldsets',
  },
  fieldsIn: {
    id: 'controlpanels.contentTypes.fieldsIn',
    defaultMessage: 'Fields in {{fieldset}}',
  },
  custom: { id: 'controlpanels.contentTypes.custom', defaultMessage: 'Custom' },
  required: {
    id: 'controlpanels.contentTypes.required',
    defaultMessage: 'Required',
  },
  lockedFieldsHelp: {
    id: 'controlpanels.contentTypes.lockedFieldsHelp',
    defaultMessage:
      'Locked fields come from behaviors. Their order is set on the behavior, and they disappear when the behavior is turned off on the Behaviors tab.',
  },
  reorderHelp: {
    id: 'controlpanels.contentTypes.reorderHelp',
    defaultMessage:
      "Drag custom fields to reorder them. With the keyboard, focus a field's drag handle, press Enter, move with the arrow keys and press Enter again.",
  },
  noFields: {
    id: 'controlpanels.contentTypes.noFields',
    defaultMessage: 'This fieldset has no fields yet.',
  },
  deleteFieldset: {
    id: 'controlpanels.contentTypes.deleteFieldset',
    defaultMessage: 'Delete fieldset',
  },
  editField: {
    id: 'controlpanels.contentTypes.editField',
    defaultMessage: 'Edit field',
  },
  fieldLabel: {
    id: 'controlpanels.contentTypes.fieldLabel',
    defaultMessage: 'Label',
  },
  fieldHelp: {
    id: 'controlpanels.contentTypes.fieldHelp',
    defaultMessage: 'Help text',
  },
  fieldType: {
    id: 'controlpanels.contentTypes.fieldType',
    defaultMessage: 'Type',
  },
  fieldset: {
    id: 'controlpanels.contentTypes.fieldset',
    defaultMessage: 'Fieldset',
  },
  fieldShortNameHelp: {
    id: 'controlpanels.contentTypes.fieldShortNameHelp',
    defaultMessage:
      "Used in code and the content API, and can't be changed later.",
  },
  deleteField: {
    id: 'controlpanels.contentTypes.deleteField',
    defaultMessage: 'Delete field',
  },
  done: { id: 'controlpanels.contentTypes.done', defaultMessage: 'Done' },
  add: { id: 'controlpanels.contentTypes.add', defaultMessage: 'Add' },
  addFieldTitle: {
    id: 'controlpanels.contentTypes.addFieldTitle',
    defaultMessage: 'Add a field',
  },
  addFieldDescription: {
    id: 'controlpanels.contentTypes.addFieldDescription',
    defaultMessage:
      'The field is added to the edit form when you save the type.',
  },
  addFieldsetTitle: {
    id: 'controlpanels.contentTypes.addFieldsetTitle',
    defaultMessage: 'Add a fieldset',
  },
  addFieldsetDescription: {
    id: 'controlpanels.contentTypes.addFieldsetDescription',
    defaultMessage: 'A fieldset groups fields in a tab of the edit form.',
  },
  nameTaken: {
    id: 'controlpanels.contentTypes.nameTaken',
    defaultMessage: 'A field or fieldset with this short name already exists.',
  },
  fieldTypesError: {
    id: 'controlpanels.contentTypes.fieldTypesError',
    defaultMessage: "The field types couldn't be loaded.",
  },
  schemaLoadError: {
    id: 'controlpanels.contentTypes.schemaLoadError',
    defaultMessage: "The fields couldn't be loaded.",
  },
  behaviorsSummary: {
    id: 'controlpanels.contentTypes.behaviorsSummary',
    defaultMessage:
      '{{on}} on · {{withFields}} add fields · {{features}} features',
  },
  addBehaviors: {
    id: 'controlpanels.contentTypes.addBehaviors',
    defaultMessage: 'Add behaviors',
  },
  formBehaviors: {
    id: 'controlpanels.contentTypes.formBehaviors',
    defaultMessage: 'Add fields to the form',
  },
  formBehaviorsHelp: {
    id: 'controlpanels.contentTypes.formBehaviorsHelp',
    defaultMessage:
      'Their order sets where their fields appear in the edit form: the first one comes first.',
  },
  formBehaviorsReorderHelp: {
    id: 'controlpanels.contentTypes.formBehaviorsReorderHelp',
    defaultMessage:
      'Drag to change the order. With the keyboard, focus a row and press Alt with the up or down arrow.',
  },
  formBehaviorsFixedOrder: {
    id: 'controlpanels.contentTypes.formBehaviorsFixedOrder',
    defaultMessage:
      "This site's content API can't change their order yet: new behaviors go to the end.",
  },
  noFormBehaviors: {
    id: 'controlpanels.contentTypes.noFormBehaviors',
    defaultMessage: 'No behaviors add fields to the form.',
  },
  behaviorFeatures: {
    id: 'controlpanels.contentTypes.behaviorFeatures',
    defaultMessage: 'Features',
  },
  behaviorFeaturesHelp: {
    id: 'controlpanels.contentTypes.behaviorFeaturesHelp',
    defaultMessage:
      "These change how items behave and add no fields, so their order doesn't matter.",
  },
  noFeatures: {
    id: 'controlpanels.contentTypes.noFeatures',
    defaultMessage: 'No features are on.',
  },
  addsFieldsList: {
    id: 'controlpanels.contentTypes.addsFieldsList',
    defaultMessage: 'Adds {{fields}}',
  },
  addsFieldsUnknown: {
    id: 'controlpanels.contentTypes.addsFieldsUnknown',
    defaultMessage: 'Its fields show in the form after saving.',
  },
  includesList: {
    id: 'controlpanels.contentTypes.includesList',
    defaultMessage: 'Includes {{behaviors}}',
  },
  removeBehavior: {
    id: 'controlpanels.contentTypes.removeBehavior',
    defaultMessage: 'Remove {{title}}',
  },
  behaviorRemoved: {
    id: 'controlpanels.contentTypes.behaviorRemoved',
    defaultMessage: '{{title}} removed',
  },
  behaviorRemovedField: {
    id: 'controlpanels.contentTypes.behaviorRemovedField',
    defaultMessage: 'Editors no longer see its field. Stored values are kept.',
  },
  behaviorRemovedFields: {
    id: 'controlpanels.contentTypes.behaviorRemovedFields',
    defaultMessage:
      'Editors no longer see its {{count}} fields. Stored values are kept.',
  },
  behaviorVariant: {
    id: 'controlpanels.contentTypes.behaviorVariant',
    defaultMessage: 'Variant of {{title}}',
  },
  formPreview: {
    id: 'controlpanels.contentTypes.formPreview',
    defaultMessage: 'Edit form preview',
  },
  formPreviewHelp: {
    id: 'controlpanels.contentTypes.formPreviewHelp',
    defaultMessage: 'Hover or focus a behavior to see its fields here.',
  },
  formPreviewEstimate: {
    id: 'controlpanels.contentTypes.formPreviewEstimate',
    defaultMessage:
      "An estimate: after saving, the backend's ordering hints may move some fields.",
  },
  formPreviewUpdating: {
    id: 'controlpanels.contentTypes.formPreviewUpdating',
    defaultMessage: 'Updating the preview…',
  },
  pendingFields: {
    id: 'controlpanels.contentTypes.pendingFields',
    defaultMessage: 'Fields from {{behaviors}} show after saving.',
  },
  addBehaviorsTitle: {
    id: 'controlpanels.contentTypes.addBehaviorsTitle',
    defaultMessage: 'Add behaviors to {{title}}',
  },
  searchBehaviors: {
    id: 'controlpanels.contentTypes.searchBehaviors',
    defaultMessage: 'Search behaviors',
  },
  showDeprecated: {
    id: 'controlpanels.contentTypes.showDeprecated',
    defaultMessage: 'Show deprecated',
  },
  newBehaviorsAtEnd: {
    id: 'controlpanels.contentTypes.newBehaviorsAtEnd',
    defaultMessage: 'New behaviors go to the end of the list.',
  },
  newBehaviorsAtEndMovable: {
    id: 'controlpanels.contentTypes.newBehaviorsAtEndMovable',
    defaultMessage:
      'New behaviors go to the end of the list. You can move them afterwards.',
  },
  includedIn: {
    id: 'controlpanels.contentTypes.includedIn',
    defaultMessage: 'Included in {{title}}',
  },
  instead: {
    id: 'controlpanels.contentTypes.instead',
    defaultMessage: 'Instead of {{title}}: switch it on its row.',
  },
  deprecatedUse: {
    id: 'controlpanels.contentTypes.deprecatedUse',
    defaultMessage: 'Deprecated: use {{title}} instead.',
  },
  containsEnabled: {
    id: 'controlpanels.contentTypes.containsEnabled',
    defaultMessage:
      'Contains {{behaviors}}, which the type has. Remove them first.',
  },
  deprecated: {
    id: 'controlpanels.contentTypes.deprecated',
    defaultMessage: 'Deprecated.',
  },
  noMatchingBehaviors: {
    id: 'controlpanels.contentTypes.noMatchingBehaviors',
    defaultMessage: 'No behaviors match.',
  },
  addSelected: {
    id: 'controlpanels.contentTypes.addSelected',
    defaultMessage: 'Add {{count}}',
  },
  groupContent: {
    id: 'controlpanels.contentTypes.groupContent',
    defaultMessage: 'Content',
  },
  groupMetadata: {
    id: 'controlpanels.contentTypes.groupMetadata',
    defaultMessage: 'Metadata',
  },
  groupEvent: {
    id: 'controlpanels.contentTypes.groupEvent',
    defaultMessage: 'Events',
  },
  groupLayout: {
    id: 'controlpanels.contentTypes.groupLayout',
    defaultMessage: 'Layout and images',
  },
  groupNavigation: {
    id: 'controlpanels.contentTypes.groupNavigation',
    defaultMessage: 'Navigation',
  },
  groupNaming: {
    id: 'controlpanels.contentTypes.groupNaming',
    defaultMessage: 'Names and URLs',
  },
  groupFeatures: {
    id: 'controlpanels.contentTypes.groupFeatures',
    defaultMessage: 'Features',
  },
  groupOther: {
    id: 'controlpanels.contentTypes.groupOther',
    defaultMessage: 'Other',
  },
  currentWorkflow: {
    id: 'controlpanels.contentTypes.currentWorkflow',
    defaultMessage: 'Current workflow',
  },
  followsSiteDefault: {
    id: 'controlpanels.contentTypes.followsSiteDefault',
    defaultMessage: 'Follows the site default',
  },
  setForThisType: {
    id: 'controlpanels.contentTypes.setForThisType',
    defaultMessage: 'Set for this type',
  },
  workflowStates: {
    id: 'controlpanels.contentTypes.workflowStates',
    defaultMessage: 'States',
  },
  initialState: {
    id: 'controlpanels.contentTypes.initialState',
    defaultMessage: 'New items start here',
  },
  transitionTo: {
    id: 'controlpanels.contentTypes.transitionTo',
    defaultMessage: '{{transition}} → {{state}}',
  },
  noWorkflowHelp: {
    id: 'controlpanels.contentTypes.noWorkflowHelp',
    defaultMessage:
      'Items of this type have no state. They take their visibility from their folder.',
  },
  workflowsUnavailable: {
    id: 'controlpanels.contentTypes.workflowsUnavailable',
    defaultMessage:
      "This site's backend doesn't tell which workflow a type uses yet.",
  },
  changeWorkflow: {
    id: 'controlpanels.contentTypes.changeWorkflow',
    defaultMessage: 'Change workflow…',
  },
  changeWorkflowUnavailable: {
    id: 'controlpanels.contentTypes.changeWorkflowUnavailable',
    defaultMessage: 'Changing the workflow needs a newer backend.',
  },
  placefulNote: {
    id: 'controlpanels.contentTypes.placefulNote',
    defaultMessage: 'Folder-level workflow policies still override this.',
  },
  visibilityAnyone: {
    id: 'controlpanels.contentTypes.visibilityAnyone',
    defaultMessage: 'Anyone',
  },
  visibilityMembers: {
    id: 'controlpanels.contentTypes.visibilityMembers',
    defaultMessage: 'Logged-in members',
  },
  visibilityRestricted: {
    id: 'controlpanels.contentTypes.visibilityRestricted',
    defaultMessage: 'People with a role on the item',
  },
  visibilityUnknown: {
    id: 'controlpanels.contentTypes.visibilityUnknown',
    defaultMessage: 'Depends on the folder',
  },
  changeWorkflowTitle: {
    id: 'controlpanels.contentTypes.changeWorkflowTitle',
    defaultMessage: 'Change workflow for {{title}}',
  },
  changeWorkflowSubtitle: {
    id: 'controlpanels.contentTypes.changeWorkflowSubtitle',
    defaultMessage: '{{items}} · currently {{workflow}}',
  },
  oneItem: {
    id: 'controlpanels.contentTypes.oneItem',
    defaultMessage: '1 item',
  },
  steps: {
    id: 'controlpanels.contentTypes.steps',
    defaultMessage: 'Steps',
  },
  stepChoose: {
    id: 'controlpanels.contentTypes.stepChoose',
    defaultMessage: 'Choose workflow',
  },
  stepMap: {
    id: 'controlpanels.contentTypes.stepMap',
    defaultMessage: 'Map states',
  },
  stepReview: {
    id: 'controlpanels.contentTypes.stepReview',
    defaultMessage: 'Review and change',
  },
  workflow: {
    id: 'controlpanels.contentTypes.workflow',
    defaultMessage: 'Workflow',
  },
  followDefault: {
    id: 'controlpanels.contentTypes.followDefault',
    defaultMessage: 'Follow the site default',
  },
  current: {
    id: 'controlpanels.contentTypes.current',
    defaultMessage: 'Current',
  },
  mostVisible: {
    id: 'controlpanels.contentTypes.mostVisible',
    defaultMessage: 'Most visible state: {{visibility}}.',
  },
  noWorkflowDescription: {
    id: 'controlpanels.contentTypes.noWorkflowDescription',
    defaultMessage: 'Items take their visibility from their folder.',
  },
  otherScopeWorkflows: {
    id: 'controlpanels.contentTypes.otherScopeWorkflows',
    defaultMessage: '{{count}} more workflows are only offered for comments.',
  },
  nextMap: {
    id: 'controlpanels.contentTypes.nextMap',
    defaultMessage: 'Next: map states',
  },
  nextReview: {
    id: 'controlpanels.contentTypes.nextReview',
    defaultMessage: 'Next: review',
  },
  back: {
    id: 'controlpanels.contentTypes.back',
    defaultMessage: 'Back',
  },
  mapHint: {
    id: 'controlpanels.contentTypes.mapHint',
    defaultMessage:
      'Choose a state in {{workflow}} for each current state. Suggestions keep who can see an item.',
  },
  mapNothing: {
    id: 'controlpanels.contentTypes.mapNothing',
    defaultMessage: '{{workflow}} has no states, so there is nothing to map.',
  },
  withoutState: {
    id: 'controlpanels.contentTypes.withoutState',
    defaultMessage: 'Without a state',
  },
  noItemsInState: {
    id: 'controlpanels.contentTypes.noItemsInState',
    defaultMessage: 'No items in this state',
  },
  newStateFor: {
    id: 'controlpanels.contentTypes.newStateFor',
    defaultMessage: 'New state for {{state}}',
  },
  stateOption: {
    id: 'controlpanels.contentTypes.stateOption',
    defaultMessage: '{{state}} · {{visibility}}',
  },
  suggested: {
    id: 'controlpanels.contentTypes.suggested',
    defaultMessage: 'Suggested',
  },
  lessVisible: {
    id: 'controlpanels.contentTypes.lessVisible',
    defaultMessage: 'Less visible: {{visibility}} only',
  },
  moreVisible: {
    id: 'controlpanels.contentTypes.moreVisible',
    defaultMessage: 'More visible: {{visibility}} can see it',
  },
  sameVisibility: {
    id: 'controlpanels.contentTypes.sameVisibility',
    defaultMessage: 'Same visibility',
  },
  lessVisibleWarning: {
    id: 'controlpanels.contentTypes.lessVisibleWarning',
    defaultMessage: 'Some items will be less visible.',
  },
  lessVisibleWarningHelp: {
    id: 'controlpanels.contentTypes.lessVisibleWarningHelp',
    defaultMessage:
      'Visitors who can see them now will get a login page instead.',
  },
  dependsOnFolder: {
    id: 'controlpanels.contentTypes.dependsOnFolder',
    defaultMessage: 'Visibility then depends on the folder',
  },
  previewError: {
    id: 'controlpanels.contentTypes.previewError',
    defaultMessage: "The change couldn't be previewed.",
  },
  reviewIntro: {
    id: 'controlpanels.contentTypes.reviewIntro',
    defaultMessage: '{{title}} will use {{workflow}} instead of {{current}}.',
  },
  reviewFollowDefault: {
    id: 'controlpanels.contentTypes.reviewFollowDefault',
    defaultMessage: '{{title}} will follow the site default, {{workflow}}.',
  },
  reviewSame: {
    id: 'controlpanels.contentTypes.reviewSame',
    defaultMessage: 'Still visible to {{visibility}}.',
  },
  reviewLess: {
    id: 'controlpanels.contentTypes.reviewLess',
    defaultMessage: 'Now visible only to {{visibility}} (was {{was}}).',
  },
  reviewMore: {
    id: 'controlpanels.contentTypes.reviewMore',
    defaultMessage: 'Now visible to {{visibility}} (was {{was}}).',
  },
  reviewRow: {
    id: 'controlpanels.contentTypes.reviewRow',
    defaultMessage: '{{items}}: {{from}} → {{to}}.',
  },
  reviewInitial: {
    id: 'controlpanels.contentTypes.reviewInitial',
    defaultMessage: 'New items will start in {{state}}.',
  },
  reviewNoWorkflow: {
    id: 'controlpanels.contentTypes.reviewNoWorkflow',
    defaultMessage: 'Items will take their visibility from their folder.',
  },
  reviewNoItems: {
    id: 'controlpanels.contentTypes.reviewNoItems',
    defaultMessage: 'There are no items to move.',
  },
  reviewUnaffected: {
    id: 'controlpanels.contentTypes.reviewUnaffected',
    defaultMessage:
      "{{count}} items under folders with their own workflow policy won't change.",
  },
  reviewNote: {
    id: 'controlpanels.contentTypes.reviewNote',
    defaultMessage:
      'Permissions are updated and items reindexed. On a large site this can take minutes.',
  },
  changeWorkflowFor: {
    id: 'controlpanels.contentTypes.changeWorkflowFor',
    defaultMessage: 'Change workflow for {{items}}',
  },
  changingWorkflow: {
    id: 'controlpanels.contentTypes.changingWorkflow',
    defaultMessage: 'Changing workflow…',
  },
  changingWorkflowHelp: {
    id: 'controlpanels.contentTypes.changingWorkflowHelp',
    defaultMessage: 'Updating permissions and reindexing.',
  },
  workflowChanged: {
    id: 'controlpanels.contentTypes.workflowChanged',
    defaultMessage: '{{title}} now uses {{workflow}}.',
  },
  workflowChangedItems: {
    id: 'controlpanels.contentTypes.workflowChangedItems',
    defaultMessage: '{{items}} updated.',
  },
  workflowChangeError: {
    id: 'controlpanels.contentTypes.workflowChangeError',
    defaultMessage: "The workflow of {{title}} couldn't be changed.",
  },
  loadingPreview: {
    id: 'controlpanels.contentTypes.loadingPreview',
    defaultMessage: 'Working out what changes…',
  },
  changeWorkflowConfirm: {
    id: 'controlpanels.contentTypes.changeWorkflowConfirm',
    defaultMessage: 'Change workflow',
  },
  siteDefaultWorkflow: {
    id: 'controlpanels.contentTypes.siteDefaultWorkflow',
    defaultMessage: 'The site default workflow',
  },
  typesCount: {
    id: 'controlpanels.contentTypes.typesCount',
    defaultMessage: '{{count}} types',
  },
  siteDefaultChanged: {
    id: 'controlpanels.contentTypes.siteDefaultChanged',
    defaultMessage: 'The site default workflow is now {{workflow}}.',
  },
  changeDefaultWorkflowTitle: {
    id: 'controlpanels.contentTypes.changeDefaultWorkflowTitle',
    defaultMessage: 'Change the site default workflow',
  },
  changeDefaultWorkflowSubtitle: {
    id: 'controlpanels.contentTypes.changeDefaultWorkflowSubtitle',
    defaultMessage: 'Currently {{workflow}} · followed by {{types}}',
  },
  noTypes: {
    id: 'controlpanels.contentTypes.noTypes',
    defaultMessage: 'no types',
  },
  mapGroup: {
    id: 'controlpanels.contentTypes.mapGroup',
    defaultMessage: 'Types using {{workflow}}',
  },
  mapGroupTitle: {
    id: 'controlpanels.contentTypes.mapGroupTitle',
    defaultMessage: '{{workflow}}: {{types}}',
  },
  reviewSiteDefault: {
    id: 'controlpanels.contentTypes.reviewSiteDefault',
    defaultMessage:
      'The site default becomes {{workflow}} instead of {{current}}. The types that follow it change too: {{types}}. Types with a workflow of their own keep it.',
  },
  reviewIntroMany: {
    id: 'controlpanels.contentTypes.reviewIntroMany',
    defaultMessage: 'These types will use {{workflow}}: {{types}}.',
  },
  changeWorkflowBulk: {
    id: 'controlpanels.contentTypes.changeWorkflowBulk',
    defaultMessage: 'Change workflow…',
  },
  changeDefault: {
    id: 'controlpanels.contentTypes.changeDefault',
    defaultMessage: 'Change',
  },
  workflowChangedMany: {
    id: 'controlpanels.contentTypes.workflowChangedMany',
    defaultMessage: '{{title}} now use {{workflow}}.',
  },
});
