/**
 * The `*.block.md` files of the add-ons, collected at build time by the
 * Plone registry Vite plugin. Only for server code: importing it from the
 * client would ship the docs to it.
 */
declare const blocksDocs: Array<{
  block: string;
  variation?: string;
  markdown: string;
}>;

export default blocksDocs;
