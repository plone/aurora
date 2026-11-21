/**
 * The content types control panel's data model.
 *
 * These types describe what the screens show and edit, not what a backend
 * sends. A driver translates between its backend and this model, so the same
 * screens work against plone.restapi, a mock, or any other source.
 */

/** How a type is versioned. */
export type VersioningPolicy = 'off' | 'manual' | 'automatic';

/** Which types can be added inside a folderish type. */
export type AllowedContents =
  { mode: 'all' } | { mode: 'selected'; types: string[] } | { mode: 'none' };

/** The workflow a type uses. */
export interface WorkflowAssignment {
  /** The workflow id, or `null` when the type has no workflow. */
  workflow: string | null;
  /** Whether the type follows the site default instead of setting its own. */
  followsDefault: boolean;
}

/**
 * - `dexterity`: a regular type, every tab applies.
 * - `site`: the site root, which can't be deleted or made addable.
 * - `other`: not a Dexterity type (e.g. Comment), only its settings apply.
 */
export type ContentTypeKind = 'dexterity' | 'site' | 'other';

/** A row in the type list. */
export interface ContentTypeSummary {
  id: string;
  title: string;
  description?: string;
  kind: ContentTypeKind;
  /** The number of items of this type on the site. */
  count: number;
  /** Optional fields are missing when the driver can't provide them. */
  globalAllow?: boolean;
  workflow?: WorkflowAssignment;
  versioning?: VersioningPolicy;
}

/** Everything the Settings tab edits for one type. */
export interface ContentTypeSettings {
  id: string;
  title: string;
  description: string;
  kind: ContentTypeKind;
  /** Whether items of this type can contain other items. */
  folderish: boolean;
  /** Only set for folderish types. */
  allowedContents?: AllowedContents;
  /** Optional settings are missing when the driver can't provide them. */
  globalAllow?: boolean;
  searchable?: boolean;
  defaultPage?: boolean;
  allowDiscussion?: boolean;
  versioning?: VersioningPolicy;
  /**
   * The names of the enabled behaviors. In order when the driver has the
   * `behaviorOrder` capability.
   */
  behaviors: string[];
  workflow?: WorkflowAssignment;
}

/**
 * The settings that change with a type save. The workflow is not part of it:
 * it changes through its own flow, because it needs a state mapping.
 */
export type ContentTypeChanges = Partial<
  Omit<ContentTypeSettings, 'id' | 'kind' | 'folderish' | 'workflow'>
>;

/** The data of the add type dialog. */
export interface NewContentType {
  title: string;
  /** Derived from the title when missing. */
  id?: string;
  description?: string;
  /** The id of a type to copy fields, behaviors, layout and settings from. */
  copyFrom?: string;
}

/** A field in a type schema, in plone.restapi's JSON schema shape. */
export interface SchemaField {
  title: string;
  description?: string;
  type?: string;
  factory?: string;
  widget?: string;
  /** The behavior that adds the field, or `plone.dexterity.schema.generated`. */
  behavior?: string;
  default?: unknown;
  [key: string]: unknown;
}

export interface SchemaFieldset {
  id: string;
  title: string;
  description?: string;
  behavior?: string;
  fields: string[];
}

/** A type schema, in plone.restapi's JSON schema shape. */
export interface TypeSchema {
  title: string;
  type: string;
  fieldsets: SchemaFieldset[];
  properties: Record<string, SchemaField>;
  required: string[];
  layouts?: string[];
}

/** The behavior name the schema editor uses for fields added to the type. */
export const CUSTOM_FIELD_BEHAVIOR = 'plone.dexterity.schema.generated';

/** A behavior that can be enabled on a type. */
export interface BehaviorInfo {
  name: string;
  title: string;
  description?: string;
  /**
   * The fields it adds, grouped by fieldset. Missing when the driver doesn't
   * have the `behaviorDetails` capability.
   */
  fieldsets?: Array<{ id: string; title: string; fields: string[] }>;
}

/**
 * Who can see an item in a workflow state, summarized from the state's View
 * permission.
 */
export type StateVisibility = 'anyone' | 'members' | 'restricted' | 'unknown';

/**
 * The color the UI shows a workflow state with, e.g. in a state badge. One
 * of the six Quanta color families, so themes and dark mode can style it.
 */
export type StateColor = 'gray' | 'blue' | 'teal' | 'green' | 'yellow' | 'red';

export interface WorkflowState {
  id: string;
  title: string;
  description?: string;
  visibility: StateVisibility;
  /**
   * The state's color when the backend sets one. Use `stateColor()` to get
   * the color to show, which also covers states without one.
   */
  color?: StateColor;
}

export interface WorkflowTransition {
  id: string;
  title: string;
  from: string[];
  to: string;
}

export interface WorkflowInfo {
  id: string;
  title: string;
  description?: string;
  initialState: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  /** Workflows meant for comments are only offered for the Comment type. */
  scope: 'content' | 'comments';
}

/** The workflow of every type, and the site default. */
export interface WorkflowAssignments {
  default: string | null;
  types: Record<string, WorkflowAssignment>;
}

/** A request to change the workflow of some types, or the site default. */
export interface WorkflowChangeRequest {
  /** The types to change. Ignored when `siteDefault` is set. */
  types?: string[];
  /** Change the site default, and with it every type that follows it. */
  siteDefault?: boolean;
  /** The new workflow, or `null` for no workflow. */
  workflow: string | null;
  /**
   * The new state for each old state, per current workflow:
   * `{ [currentWorkflow]: { [oldState]: newState } }`. Types without a
   * workflow use `''` as the workflow and as their only state. States left
   * out get the suggested state.
   */
  stateMap?: Record<string, Record<string, string>>;
}

/** The items of some types that share a current workflow. */
export interface WorkflowChangeGroup {
  /** The current workflow, or `null` when the types have none. */
  workflow: string | null;
  types: string[];
  states: Array<{
    /** `''` for types without a workflow. */
    state: string;
    count: number;
    /** The state in the new workflow that keeps the same visibility. */
    suggested: string | null;
  }>;
}

/** What a workflow change would do, without changing anything. */
export interface WorkflowChangePreview {
  workflow: string | null;
  groups: WorkflowChangeGroup[];
  /** Items under a folder with its own workflow policy, which won't change. */
  unaffected: number;
}

/** A running or finished workflow change. */
export interface WorkflowChangeJob {
  id: string;
  status: 'running' | 'done' | 'failed';
  /** From 0 to 1. */
  progress: number;
  /** The number of items changed so far. */
  changed: number;
  error?: string;
}

/** The settings new types start with, and the site default workflow. */
export interface SiteDefaults {
  workflow: string | null;
  globalAllow: boolean;
  versioning: VersioningPolicy;
}
