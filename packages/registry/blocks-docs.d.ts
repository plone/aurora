/**
 * The `*.block.md` files of the add-ons, collected at build time by the
 * Plone registry Vite plugin. Only for server code: importing it from the
 * client would ship the docs to it.
 */
declare const blocksDocs: Array<{
  /** The documented block, or `element` for an element of the document. */
  block?: string;
  variation?: string;
  element?: string;
  title?: string;
  markdown: string;
}>;

export default blocksDocs;
