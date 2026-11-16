import type { JSONSchema } from '@plone/types';
import type { NodeEntry, SlateEditor, TElement } from 'platejs';

import type { TranslateFunction } from '../i18n';

/** A block settings schema, with an optional note shown above its fields. */
export type BlockSettingsSchema = JSONSchema & { description?: string };

/**
 * Adapts the settings schema of a block to the container it's in, for
 * example by removing the fields that don't apply there.
 */
export type InnerBlockSchemaEnhancer = (
  schema: BlockSettingsSchema,
  context: {
    /** The `@type` of a Plone block, or the type of a Plate.js element. */
    blockType: string;
    /** The container element, such as the accordion. */
    container: TElement;
    t: TranslateFunction;
  },
) => BlockSettingsSchema;

/** Overrides of a block's config while it's inside a container. */
export type InnerBlockConfig = {
  schemaEnhancer?: InnerBlockSchemaEnhancer;
};

/**
 * Declares a Plate.js block as a container of other blocks. A plugin declares
 * it in its `container` option, as an object or as a function of the editor,
 * so it can follow the plugin's other options.
 */
export type BlockContainerSpec = {
  /** The container's element type, such as `accordion`. */
  type: string;
  /**
   * The element whose children are the inner blocks, such as
   * `accordion_panel_content`. It sits inside the container element.
   */
  slot: string;
  /**
   * The blocks a slot can hold: Plate.js element types, such as `p`, and the
   * `@type` of Plone blocks, such as `image`.
   */
  allowedBlocks: string[];
  /** Whether the container can be placed inside itself. Default: `false`. */
  nestable?: boolean;
  /**
   * What happens to this container when it ends up in a container that
   * can't hold it, for example after a paste: it moves after that container
   * (`move-after`, the default), or it's unwrapped and its blocks stay in
   * place (`unwrap`).
   */
  whenDisallowed?: 'move-after' | 'unwrap';
  /**
   * Overrides of the global block config for the blocks inside the
   * container, by block type. `*` applies to every block, before the
   * block's own entry.
   */
  blocksConfig?: Record<string, InnerBlockConfig>;
  /** The container's name, such as "Accordion". */
  label: (t: TranslateFunction) => string;
  /**
   * Shown in the slash menu inside the container when it can't be nested,
   * such as "Accordions can't be placed inside an accordion."
   */
  nestingNote?: (t: TranslateFunction) => string;
};

export type BlockContainerOption =
  BlockContainerSpec | ((editor: SlateEditor) => BlockContainerSpec);

/** The container a block sits in, and the slot that holds it. */
export type BlockContainerEntry = {
  spec: BlockContainerSpec;
  container: NodeEntry<TElement>;
  slot: NodeEntry<TElement>;
};
