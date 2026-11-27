import {
  ElementApi,
  type Location,
  type NodeEntry,
  type SlateEditor,
  type TElement,
} from 'platejs';

import type {
  BlockContainerEntry,
  BlockContainerOption,
  BlockContainerSpec,
} from './types';

type EditorWithPlugins = Pick<SlateEditor, 'plugins'>;

/** The containers that the editor's plugins declare in their `container` option. */
export const getContainerSpecs = (
  editor: EditorWithPlugins,
): BlockContainerSpec[] => {
  const specs: BlockContainerSpec[] = [];
  for (const plugin of Object.values(editor.plugins ?? {})) {
    const option = (plugin?.options as { container?: BlockContainerOption })
      ?.container;
    if (!option) continue;
    specs.push(
      typeof option === 'function'
        ? option(editor as unknown as SlateEditor)
        : option,
    );
  }
  return specs;
};

/** The container whose slot has the given element type, if any. */
export const getContainerSpecBySlot = (
  editor: EditorWithPlugins,
  slotType: string,
): BlockContainerSpec | undefined =>
  getContainerSpecs(editor).find((spec) => spec.slot === slotType);

/**
 * The container that a location sits in: its closest slot, such as an
 * accordion panel's content, and the container element around it. For a
 * path, the node at the path itself doesn't count, so the entry of an inner
 * block is the container that holds it.
 */
export const getBlockContainer = (
  editor: SlateEditor,
  at: Location | null | undefined = editor.selection,
): BlockContainerEntry | undefined => {
  if (!at) return undefined;
  const specs = getContainerSpecs(editor);
  if (specs.length === 0) return undefined;
  const slotTypes = new Set(specs.map((spec) => spec.slot));

  let slot: NodeEntry<TElement> | undefined;
  try {
    slot = editor.api.above<TElement>({
      at,
      match: (node) =>
        ElementApi.isElement(node) && slotTypes.has(node.type as string),
    });
  } catch {
    return undefined;
  }
  if (!slot) return undefined;

  const spec = specs.find((item) => item.slot === slot[0].type)!;
  const container = editor.api.above<TElement>({
    at: slot[1],
    match: { type: spec.type },
  });
  if (!container) return undefined;

  return { spec, container, slot };
};

/**
 * The containers around a location, from the closest one out. A block inside
 * a container inside another one sits in both.
 */
export const getBlockContainers = (
  editor: SlateEditor,
  at: Location | null | undefined = editor.selection,
): BlockContainerEntry[] => {
  const entries: BlockContainerEntry[] = [];
  let entry = getBlockContainer(editor, at);
  while (entry) {
    entries.push(entry);
    entry = getBlockContainer(editor, entry.container[1]);
  }
  return entries;
};
