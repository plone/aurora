import * as restapi from './restapi';

import type { PloneClientConfig } from './validation/config';

const PLONECLIENT_DEFAULT_CONFIG = {
  apiPath: 'http://localhost:8080/Plone',
};

/**
 * Assigns each function of `methods` to `target`, bound to `target`, so the
 * methods keep the client as `this` when detached from it
 * (for example, `const { getContent } = cli`).
 */
function bindMethods(target: object, methods: object) {
  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === 'function') {
      (target as Record<string, unknown>)[key] = value.bind(target);
    }
  }
}

/**
 * Methods added to `PloneClient` by `PloneClient.extend()`.
 *
 * Add-ons type their own methods through module augmentation:
 *
 * ```ts
 * declare module '@plone/client' {
 *   interface PloneClientExtensions {
 *     getIdentityProviders: typeof getIdentityProviders;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PloneClientExtensions {}

/**
 * A set of methods to add to `PloneClient`. Each method receives the client
 * instance as `this`, so it can read `this.config` and call other methods.
 */
export type PloneClientMethods = Record<string, (...args: any[]) => any>;

/**
 * The class returned by `PloneClient.extend()`: `T` with `M` added to its
 * instances.
 */
export type ExtendedPloneClient<
  T extends typeof PloneClient,
  M extends PloneClientMethods,
> = Omit<T, 'prototype'> & {
  new (config: PloneClientConfig): InstanceType<T> & M;
  prototype: InstanceType<T> & M;
};

// Merge the augmentable interface into the class instance type.
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface PloneClient extends PloneClientExtensions {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class PloneClient {
  public config: PloneClientConfig = PLONECLIENT_DEFAULT_CONFIG;

  static initialize<T extends typeof PloneClient>(
    this: T,
    config: PloneClientConfig,
  ): InstanceType<T> {
    return new this({
      ...PLONECLIENT_DEFAULT_CONFIG,
      ...config,
    }) as InstanceType<T>;
  }

  /**
   * Returns a subclass of this class whose instances also have `methods`.
   * Calls can be chained, and each one builds on the class it is called on,
   * so several add-ons can each contribute their own methods.
   * A method with the same name as an existing one replaces it.
   */
  static extend<T extends typeof PloneClient, M extends PloneClientMethods>(
    this: T,
    methods: M,
  ): ExtendedPloneClient<T, M> {
    const extensions = { ...methods };
    // Core endpoints are instance fields, so the extensions are assigned in
    // the constructor (not on the prototype) to be able to override them.
    const Extended = class extends (this as typeof PloneClient) {
      constructor(config: PloneClientConfig) {
        super(config);
        bindMethods(this, extensions);
      }
    };
    return Extended as unknown as ExtendedPloneClient<T, M>;
  }

  constructor(config: PloneClientConfig) {
    this.config = config;

    bindMethods(this, this);
  }

  getActions = restapi.getActions;

  getAddons = restapi.getAddons;
  getAddon = restapi.getAddon;
  installAddon = restapi.installAddon;
  uninstallAddon = restapi.uninstallAddon;
  upgradeAddon = restapi.upgradeAddon;
  installAddonProfile = restapi.installAddonProfile;

  getAllAliases = restapi.getAllAliases;
  getAliases = restapi.getAliases;
  createAlias = restapi.createAlias;
  createAliases = restapi.createAliases;
  deleteAliases = restapi.deleteAliases;

  getBreadcrumbs = restapi.getBreadcrumbs;

  getComments = restapi.getComments;
  createComment = restapi.createComment;
  updateComment = restapi.updateComment;
  deleteComment = restapi.deleteComment;

  getContent = restapi.getContent;
  createContent = restapi.createContent;
  updateContent = restapi.updateContent;
  deleteContent = restapi.deleteContent;
  copyContent = restapi.copyContent;
  moveContent = restapi.moveContent;

  getContextNavigation = restapi.getContextNavigation;

  getControlpanels = restapi.getControlpanels;
  getControlpanel = restapi.getControlpanel;
  createControlpanel = restapi.createControlpanel;
  updateControlpanel = restapi.updateControlpanel;
  deleteControlpanel = restapi.deleteControlpanel;

  getDatabase = restapi.getDatabase;

  emailNotification = restapi.emailNotification;

  emailSend = restapi.emailSend;

  getGroups = restapi.getGroups;
  getGroup = restapi.getGroup;
  createGroup = restapi.createGroup;
  updateGroup = restapi.updateGroup;
  deleteGroup = restapi.deleteGroup;

  getHistory = restapi.getHistory;
  getHistoryVersion = restapi.getHistoryVersion;
  revertHistory = restapi.revertHistory;

  getLinkintegrity = restapi.getLinkintegrity;

  getLock = restapi.getLock;
  createLock = restapi.createLock;
  updateLock = restapi.updateLock;
  deleteLock = restapi.deleteLock;

  login = restapi.login;

  getNavigation = restapi.getNavigation;

  getNavroot = restapi.getNavroot;

  getPrincipals = restapi.getPrincipals;

  getQuerysources = restapi.getQuerysources;

  getQuerystring = restapi.getQuerystring;

  querystringSearch = restapi.querystringSearch;

  getRegistry = restapi.getRegistry;
  getRegistryRecord = restapi.getRegistryRecord;
  updateRegistry = restapi.updateRegistry;

  getAllRelations = restapi.getAllRelations;
  getRelations = restapi.getRelations;
  createRelations = restapi.createRelations;
  fixRelations = restapi.fixRelations;
  deleteRelations = restapi.deleteRelations;

  getRoles = restapi.getRoles;

  getRules = restapi.getRules;
  createRule = restapi.createRule;
  updateRules = restapi.updateRules;
  deleteRules = restapi.deleteRules;

  search = restapi.search;

  getSharing = restapi.getSharing;
  updateSharing = restapi.updateSharing;

  getSite = restapi.getSite;

  getSource = restapi.getSource;

  getSystem = restapi.getSystem;

  getTransactions = restapi.getTransactions;
  revertTransactions = restapi.revertTransactions;

  getTranslation = restapi.getTranslation;
  linkTranslation = restapi.linkTranslation;
  unlinkTranslation = restapi.unlinkTranslation;

  getTypes = restapi.getTypes;
  getType = restapi.getType;
  getTypeField = restapi.getTypeField;
  createTypeField = restapi.createTypeField;
  updateTypeField = restapi.updateTypeField;

  getUpgrade = restapi.getUpgrade;
  runUpgrade = restapi.runUpgrade;

  getUsers = restapi.getUsers;
  getUser = restapi.getUser;
  createUser = restapi.createUser;
  updateUser = restapi.updateUser;
  deleteUser = restapi.deleteUser;
  resetPassword = restapi.resetPassword;
  resetPasswordWithToken = restapi.resetPasswordWithToken;
  updatePassword = restapi.updatePassword;

  getUserschema = restapi.getUserschema;

  getVocabularies = restapi.getVocabularies;
  getVocabulary = restapi.getVocabulary;

  getWorkflow = restapi.getWorkflow;
  createWorkflow = restapi.createWorkflow;

  getWorkingcopy = restapi.getWorkingcopy;
  createWorkingcopy = restapi.createWorkingcopy;
  checkInWorkingcopy = restapi.checkInWorkingcopy;
  deleteWorkingcopy = restapi.deleteWorkingcopy;
}

export default PloneClient;
