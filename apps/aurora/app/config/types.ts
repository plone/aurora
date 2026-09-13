import type { Content } from '@plone/types';
import type PloneClient from '@plone/client';
import type { Value } from '@plone/plate/components/editor';
import type { Params } from 'react-router';

export type PloneClientUtility = typeof PloneClient;

declare module '@plone/types' {
  interface UtilityTypeMap {
    client: () => PloneClientUtility;
    rootContentSubRequest: (args: LoaderUtilityArgs) => Promise<unknown>;
    // A `rootLoaderData` utility returns a `{ status, data }` envelope — the
    // same shape as a PloneClient response — so a utility that queries Plone
    // can pass the response straight through. The root loader merges each
    // utility's `data` into the root loader data (see `app/root.tsx`), so
    // utilities should namespace their `data` under a unique key (for example
    // `{ status, data: { likes: {...} } }`) to avoid clobbering others.
    // NOTE: `status` is not acted upon yet (see TODO in `app/root.tsx`).
    rootLoaderData: (
      args: LoaderUtilityArgs,
    ) => Promise<{ status: number; data: unknown }>;
    somersaultBlockMigration: (
      args: SomersaultBlockMigrationArgs,
    ) => SomersaultMigrationArgs['value'];
    somersaultMigration: (
      args: SomersaultMigrationArgs,
    ) => SomersaultMigrationArgs['value'];
  }
}

export interface LoaderUtilityArgs {
  cli: PloneClient;
  content: Content;
  request: Request;
  path: string;
  params: Params;
  locale: string;
}

export interface SomersaultMigrationArgs {
  content: Content;
  value: Value;
}

export interface SomersaultBlockMigrationArgs {
  block: Record<string, unknown>;
  blockId: string;
  content: Content;
}
