import {
  ElementApi,
  KEYS,
  PathApi,
  TextApi,
  type Descendant,
  type Path,
  type SlateEditor,
  type TElement,
} from 'platejs';

import {
  createEmptyParagraph,
  getAvailableInnerBlocks,
  getInnerBlockId,
} from './inner-blocks';
import {
  getBlockContainers,
  getContainerSpecBySlot,
  getContainerSpecs,
} from './registry';

/** Whether a block only holds text and inline elements, like a paragraph. */
export const isTextLikeBlock = (editor: SlateEditor, node: TElement) =>
  !editor.api.isVoid(node) &&
  node.children.every(
    (child) =>
      TextApi.isText(child) ||
      (ElementApi.isElement(child) && editor.api.isInline(child)),
  );

/**
 * Keeps the blocks of a container's slot valid: at least one block, and only
 * blocks the container can hold. A block it can't hold:
 *
 * - becomes a paragraph, when it's a text block and paragraphs are allowed;
 * - is unwrapped, leaving its blocks in place, when it's a container of
 *   blocks, such as a quote, or a container declared with
 *   `whenDisallowed: 'unwrap'`;
 * - moves after the container otherwise, so no content is lost.
 *
 * Call it from the `normalizeNode` of the plugin that owns the slot, once the
 * slot itself is in place. Returns `true` when it changed the editor, and the
 * node is normalized again.
 */
export const normalizeSlotBlocks = (
  editor: SlateEditor,
  node: TElement,
  path: Path,
): boolean => {
  const spec = getContainerSpecBySlot(editor, node.type);
  if (!spec) return false;
  const container = editor.api.above<TElement>({
    at: path,
    match: { type: spec.type },
  });
  if (!container) return false;

  if (!node.children.some((child) => ElementApi.isElement(child))) {
    editor.tf.insertNodes(createEmptyParagraph(), { at: [...path, 0] });
    return true;
  }

  const available = getAvailableInnerBlocks(
    editor,
    spec,
    getBlockContainers(editor, container[1]),
  );
  const canBecomeParagraph = available.includes(KEYS.p);
  const specs = getContainerSpecs(editor);
  const toParagraph: Path[] = [];
  const toUnwrap: Path[] = [];
  const toLift: Path[] = [];

  node.children.forEach((child: Descendant, index) => {
    if (!ElementApi.isElement(child)) return;
    const id = getInnerBlockId(child);
    if (id && available.includes(id)) return;

    const at = [...path, index];
    const known = Boolean(editor.plugins[child.type]);
    const childSpec = specs.find((item) => item.type === child.type);
    if (!known || editor.api.isVoid(child)) {
      toLift.push(at);
    } else if (childSpec) {
      (childSpec.whenDisallowed === 'unwrap' ? toUnwrap : toLift).push(at);
    } else if (canBecomeParagraph && isTextLikeBlock(editor, child)) {
      toParagraph.push(at);
    } else if (child.children.every((item) => ElementApi.isElement(item))) {
      toUnwrap.push(at);
    } else {
      toLift.push(at);
    }
  });

  // One kind of change per pass, so the paths stay valid; the slot is
  // normalized again after each one.
  if (toParagraph.length > 0) {
    editor.tf.withoutNormalizing(() => {
      for (const at of toParagraph) {
        editor.tf.setNodes({ type: KEYS.p }, { at });
      }
    });
    return true;
  }

  if (toUnwrap.length > 0) {
    // A container, such as a quote, leaves its blocks in place.
    editor.tf.withoutNormalizing(() => {
      for (const at of [...toUnwrap].reverse()) {
        editor.tf.unwrapNodes({ at });
      }
    });
    return true;
  }

  if (toLift.length > 0) {
    // Blocks the slot can't hold go after the container, in their order:
    // moving the last one first keeps them in order.
    editor.tf.withoutNormalizing(() => {
      for (const at of [...toLift].reverse()) {
        editor.tf.moveNodes({ at, to: PathApi.next(container[1]) });
      }
    });
    return true;
  }

  return false;
};
