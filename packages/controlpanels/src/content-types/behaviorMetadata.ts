/**
 * What the Behaviors tab knows about behaviors beyond what a backend says:
 * how to group them, which ones overlap, and which ones are deprecated.
 * Backends don't register any of this, so the control panel ships defaults
 * for the core behaviors, and frameworks and add-ons extend them (see
 * `ContentTypesDriverProvider`'s `behaviorMetadata`).
 */
export interface BehaviorMetadata {
  /**
   * The group the add dialog shows it in. One of `BEHAVIOR_GROUPS`, or any
   * other id, shown as is. Behaviors without a group go in `other`.
   */
  group?: string;
  /**
   * Behaviors it already contains, e.g. Dublin Core contains Basic metadata.
   * They can't be enabled next to it.
   */
  includes?: string[];
  /**
   * Behaviors that do the same in another way, of which a type uses one,
   * e.g. a preview image as an upload or as a link. The tab switches between
   * them in place.
   */
  alternatives?: string[];
  /** Hidden in the add dialog unless asked for. */
  deprecated?: boolean;
  /** The behavior to use instead of a deprecated one. */
  replacement?: string;
  /**
   * Whether it adds fields to the edit form, for drivers that can't say
   * (without the `behaviorDetails` capability).
   */
  addsFields?: boolean;
  /**
   * The names its fields use as their `behavior` in a type schema, when they
   * aren't the behavior's name, e.g. its interface.
   */
  aliases?: string[];
}

export type BehaviorMetadataMap = Record<string, BehaviorMetadata>;

/** The groups of the add dialog, in order. */
export const BEHAVIOR_GROUPS = [
  'content',
  'metadata',
  'event',
  'layout',
  'navigation',
  'naming',
  'features',
  'other',
] as const;

const feature = (group: string): BehaviorMetadata => ({
  group,
  addsFields: false,
});

/** The defaults for Plone's and plone.volto's behaviors. */
export const DEFAULT_BEHAVIOR_METADATA: BehaviorMetadataMap = {
  'plone.richtext': { group: 'content' },
  'plone.leadimage': { group: 'content' },
  'plone.relateditems': { group: 'content' },
  'plone.tableofcontents': { group: 'content' },
  'plone.collection': { group: 'content' },
  'volto.kicker': { group: 'content' },
  'volto.head_title': {
    group: 'content',
    deprecated: true,
    replacement: 'volto.kicker',
  },

  'plone.dublincore': {
    group: 'metadata',
    includes: [
      'plone.basic',
      'plone.categorization',
      'plone.publication',
      'plone.ownership',
    ],
  },
  'plone.basic': { group: 'metadata' },
  'plone.categorization': { group: 'metadata' },
  'plone.publication': { group: 'metadata' },
  'plone.ownership': { group: 'metadata' },
  'plone.allowdiscussion': {
    group: 'metadata',
    aliases: ['plone.app.discussion.behavior.IAllowDiscussion'],
  },

  'plone.eventbasic': { group: 'event' },
  'plone.eventrecurrence': { group: 'event' },
  'plone.eventlocation': { group: 'event' },
  'plone.eventattendees': { group: 'event' },
  'plone.eventcontact': { group: 'event' },

  'volto.blocks': {
    group: 'layout',
    alternatives: ['volto.blocks.editable.layout'],
  },
  'volto.blocks.editable.layout': {
    group: 'layout',
    alternatives: ['volto.blocks'],
  },
  'volto.preview_image': {
    group: 'layout',
    alternatives: ['volto.preview_image_link'],
  },
  'volto.preview_image_link': {
    group: 'layout',
    alternatives: ['volto.preview_image'],
  },
  'plone.thumb_icon': { group: 'layout' },

  'plone.excludefromnavigation': { group: 'navigation' },
  'volto.navtitle': { group: 'navigation' },
  'plone.navigationroot': feature('navigation'),
  'plone.nextpreviousenabled': {
    ...feature('navigation'),
    alternatives: ['plone.nextprevioustoggle'],
  },
  'plone.nextprevioustoggle': {
    group: 'navigation',
    alternatives: ['plone.nextpreviousenabled'],
  },

  'plone.namefromtitle': {
    ...feature('naming'),
    alternatives: ['plone.namefromfilename'],
  },
  'plone.namefromfilename': {
    ...feature('naming'),
    alternatives: ['plone.namefromtitle'],
  },
  'plone.shortname': { group: 'naming' },

  'plone.locking': feature('features'),
  'plone.textindexer': feature('features'),
  'plone.translatable': feature('features'),
  'plone.constraintypes': feature('features'),
  'plone.versioning': { group: 'features' },
};

/** Merges metadata over the defaults, behavior by behavior. */
export function mergeBehaviorMetadata(
  ...maps: Array<BehaviorMetadataMap | undefined>
): BehaviorMetadataMap {
  const merged: BehaviorMetadataMap = {};
  for (const map of maps) {
    for (const [name, metadata] of Object.entries(map ?? {})) {
      merged[name] = { ...merged[name], ...metadata };
    }
  }
  return merged;
}
