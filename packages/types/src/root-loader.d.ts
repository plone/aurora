import type { Content } from './content';
import type { GetSiteResponse } from './services/site';

/**
 * The data of the app's root route (`root`), as its loader returns it.
 *
 * Read it in a route or a component with
 * `useRouteLoaderData<RootLoaderData>('root')`, or in a `meta` function with
 * `MetaFunction<unknown, { root: RootLoaderData }>`.
 *
 * The `rootLoaderData` utilities merge their own data into it. An add-on
 * declares what it adds with module augmentation:
 *
 * ```ts
 * declare module '@plone/types' {
 *   export interface RootLoaderData {
 *     myAddon: MyAddonData;
 *   }
 * }
 * ```
 */
export interface RootLoaderData {
  /** The content at the current path. */
  content: Content;
  /** The `@site` data of the site. */
  site: GetSiteResponse;
  /** The interface language of the request. */
  locale: string;
  /** Whether a user is logged in. */
  isAuthenticated: boolean;
}

/**
 * The type of the app's root loader, for the React Router types that take a
 * loader function instead of its data, such as `MetaFunction`:
 *
 * ```ts
 * export const meta: MetaFunction<unknown, { root: RootLoader }> = ({
 *   matches,
 * }) => {
 *   const root = matches.find((match) => match.id === 'root')?.loaderData;
 *   // ...
 * };
 * ```
 */
export type RootLoader = () => Promise<RootLoaderData>;
