import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_BEHAVIOR_METADATA,
  mergeBehaviorMetadata,
  type BehaviorMetadataMap,
} from './behaviorMetadata';
import type {
  BehaviorInfo,
  ContentTypeChanges,
  ContentTypeSettings,
  ContentTypeSummary,
  FieldType,
  NewContentType,
  SiteDefaults,
  StateColor,
  TypeSchema,
  WorkflowAssignments,
  WorkflowChangeJob,
  WorkflowChangePreview,
  WorkflowChangeRequest,
  WorkflowInfo,
  WorkflowState,
} from './types';
import { stateColor } from './workflow/stateColor';

/**
 * What a driver's backend supports beyond the basics. The screens hide or
 * disable, with an explanation, whatever a driver can't do yet.
 */
export interface ContentTypesCapabilities {
  /** Read and change whether a type is globally addable. */
  globalAllow: boolean;
  /** Read and change whether a type shows in search results. */
  searchable: boolean;
  /** Read and change whether a type can be a folder's default page. */
  defaultPage: boolean;
  /** Read and change whether a type allows comments. */
  allowDiscussion: boolean;
  /** Read and change a type's versioning policy. */
  versioning: boolean;
  /** Behaviors keep their order, and saving a type can change it. */
  behaviorOrder: boolean;
  /** Behaviors say which fields they add. */
  behaviorDetails: boolean;
  /** `previewSchema` is available. */
  schemaPreview: boolean;
  /** Saving a schema can change the order of its fieldsets. */
  fieldsetOrder: boolean;
  /** `listWorkflows` and `getWorkflowAssignments` are available. */
  workflows: boolean;
  /** `previewWorkflowChange`, `changeWorkflow` and `getWorkflowChangeJob` are available. */
  workflowChange: boolean;
  /** `getSiteDefaults` and `updateSiteDefaults` are available. */
  siteDefaults: boolean;
  /** `createType` accepts `copyFrom`. */
  copyType: boolean;
  /** `exportTypes` and `importTypes` are available. */
  importExport: boolean;
}

/**
 * How the content types control panel reads and writes its data.
 *
 * The screens never call a backend themselves: every app passes a driver
 * that reads and writes through its own access to the backend, and tests and
 * stories use the mock driver. Methods marked optional exist only when the
 * matching capability is on.
 */
export interface ContentTypesDriver {
  capabilities: ContentTypesCapabilities;

  listTypes(): Promise<ContentTypeSummary[]>;
  getType(id: string): Promise<ContentTypeSettings>;
  createType(type: NewContentType): Promise<ContentTypeSummary>;
  updateType(id: string, changes: ContentTypeChanges): Promise<void>;
  deleteType(id: string): Promise<void>;

  /** A type's fieldsets and fields, including the ones its behaviors add. */
  getSchema(id: string): Promise<TypeSchema>;
  /**
   * Replaces the type's own fields and fieldsets: adds, changes, moves and
   * deletes them. Fields and fieldsets from behaviors are left as they are.
   */
  saveSchema(id: string, schema: TypeSchema): Promise<void>;
  /** The kinds of fields that can be added to a type. */
  listFieldTypes(): Promise<FieldType[]>;
  /** The schema a type would have with these behaviors, in this order. */
  previewSchema?(id: string, behaviors: string[]): Promise<TypeSchema>;

  listBehaviors(): Promise<BehaviorInfo[]>;

  listWorkflows?(): Promise<WorkflowInfo[]>;
  getWorkflowAssignments?(): Promise<WorkflowAssignments>;
  previewWorkflowChange?(
    request: WorkflowChangeRequest,
  ): Promise<WorkflowChangePreview>;
  changeWorkflow?(request: WorkflowChangeRequest): Promise<WorkflowChangeJob>;
  getWorkflowChangeJob?(id: string): Promise<WorkflowChangeJob>;

  getSiteDefaults?(): Promise<SiteDefaults>;
  updateSiteDefaults?(defaults: Partial<SiteDefaults>): Promise<void>;

  exportTypes?(ids: string[]): Promise<Blob>;
  importTypes?(file: Blob): Promise<ContentTypeSummary[]>;
}

/** A driver's capabilities when its backend only does the basics. */
export const NO_CAPABILITIES: ContentTypesCapabilities = {
  globalAllow: false,
  searchable: false,
  defaultPage: false,
  allowDiscussion: false,
  versioning: false,
  behaviorOrder: false,
  behaviorDetails: false,
  schemaPreview: false,
  fieldsetOrder: false,
  workflows: false,
  workflowChange: false,
  siteDefaults: false,
  copyType: false,
  importExport: false,
};

const ContentTypesDriverContext = createContext<ContentTypesDriver | null>(
  null,
);

const StateColorsContext = createContext<
  Readonly<Record<string, StateColor>> | undefined
>(undefined);

const BehaviorMetadataContext = createContext<BehaviorMetadataMap>(
  DEFAULT_BEHAVIOR_METADATA,
);

export function ContentTypesDriverProvider({
  driver,
  behaviorMetadata,
  stateColors,
  children,
}: {
  driver: ContentTypesDriver;
  /**
   * What the Behaviors tab knows about behaviors beyond what the backend
   * says, merged over the defaults for the core behaviors. Frameworks pass
   * what add-ons register, e.g. Aurora's `config.settings.behaviorMetadata`.
   */
  behaviorMetadata?: BehaviorMetadataMap;
  /**
   * The colors of workflow states, by state id, over every other source (see
   * `stateColor`). Frameworks pass what the site configures, e.g. Aurora's
   * `config.settings.workflowStateColors`.
   */
  stateColors?: Readonly<Record<string, StateColor>>;
  children?: ReactNode;
}) {
  const metadata = useMemo(
    () => mergeBehaviorMetadata(DEFAULT_BEHAVIOR_METADATA, behaviorMetadata),
    [behaviorMetadata],
  );
  return (
    <ContentTypesDriverContext.Provider value={driver}>
      <BehaviorMetadataContext.Provider value={metadata}>
        <StateColorsContext.Provider value={stateColors}>
          {children}
        </StateColorsContext.Provider>
      </BehaviorMetadataContext.Provider>
    </ContentTypesDriverContext.Provider>
  );
}

/** The behavior metadata of the closest `ContentTypesDriverProvider`. */
export function useBehaviorMetadata(): BehaviorMetadataMap {
  return useContext(BehaviorMetadataContext);
}

/**
 * The color to show a workflow state with, with the `stateColors` of the
 * closest `ContentTypesDriverProvider`.
 */
export function useStateColor(): (
  state: Pick<WorkflowState, 'id' | 'visibility' | 'color'>,
) => StateColor {
  const stateColors = useContext(StateColorsContext);
  return useCallback((state) => stateColor(state, stateColors), [stateColors]);
}

/** The driver of the closest `ContentTypesDriverProvider`. */
export function useContentTypesDriver(): ContentTypesDriver {
  const driver = useContext(ContentTypesDriverContext);
  if (!driver) {
    throw new Error(
      'useContentTypesDriver must be used inside a ContentTypesDriverProvider',
    );
  }
  return driver;
}
