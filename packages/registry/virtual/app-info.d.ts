/**
 * The name and version of the app (from its `package.json`) and of each of
 * its add-ons, in add-on order, collected at build time by the Plone registry
 * Vite plugin. It has no paths, so client code can import it.
 */
export type AppInfo = {
  name: string;
  version: string;
  addons: Array<{ name: string; version: string }>;
};

declare const appInfo: AppInfo;

export default appInfo;
