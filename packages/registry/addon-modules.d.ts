/**
 * The `<path>` module of every add-on that has one, in add-on order,
 * collected at build time by the Plone registry Vite plugin when importing
 * `@plone/registry/addons/<path>`. `module` is its default export.
 */
declare const addonModules: Array<{ addon: string; module: unknown }>;

export default addonModules;
