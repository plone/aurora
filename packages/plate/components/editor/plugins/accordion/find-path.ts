import type { Path, TElement } from 'platejs';

import { ACCORDION_KEY } from './types';

type EditorLike = {
  children: unknown[];
  api: {
    nodes: (options: {
      at: Path;
      match: (node: unknown) => boolean;
    }) => Iterable<[unknown, Path]>;
  };
};

/**
 * The path of a node of an accordion (the accordion, a panel, a title, a
 * content or one of a panel's blocks), looked up in the editor's value.
 *
 * Slate's `findPath` reads maps that React updates when it renders, so right
 * after nodes move it can still return their old position. Components that
 * act on a position read from the editor on every change use this instead.
 */
export const findAccordionNodePath = (
  editor: EditorLike,
  element: unknown,
): Path | undefined => {
  // Most accordions are top-level blocks.
  for (let i = 0; i < editor.children.length; i += 1) {
    const accordion = editor.children[i] as TElement;
    if (accordion === element) return [i];
    if (accordion?.type !== ACCORDION_KEY) continue;
    for (let j = 0; j < accordion.children.length; j += 1) {
      const panel = accordion.children[j] as TElement;
      if (panel === element) return [i, j];
      const children = (panel.children ?? []) as TElement[];
      for (let k = 0; k < children.length; k += 1) {
        if (children[k] === element) return [i, j, k];
      }
      const blocks = (children[1]?.children ?? []) as unknown[];
      const l = blocks.indexOf(element);
      if (l >= 0) return [i, j, 1, l];
    }
  }

  for (const [, path] of editor.api.nodes({
    at: [],
    match: (node) => node === element,
  })) {
    return path;
  }
  return undefined;
};
