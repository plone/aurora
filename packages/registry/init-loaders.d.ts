/**
 * Generates the files of the Plone registry in the `.plone` folder of the app:
 * the add-on loaders, the styles and locales loaders, and the registered
 * routes and add-ons.
 */
export function initPloneRegistryLoaders(options?: {
  /** The root of the app. Defaults to the working directory. */
  projectRootPath?: string;
}): Promise<{
  registry: unknown;
  shadowAliases: unknown[];
  addonsLoaderPath: string;
}>;
