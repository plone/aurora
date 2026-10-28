/**
 * The `config/plate-editor` (for `@plone/registry/plate-editor`) or
 * `config/plate-renderer` (for `@plone/registry/plate-renderer`) module of
 * every add-on that has one, in add-on order, collected at build time by the
 * Plone registry Vite plugin. `module` is its default export.
 */
declare const platePluginsModules: Array<{ addon: string; module: unknown }>;

export default platePluginsModules;
