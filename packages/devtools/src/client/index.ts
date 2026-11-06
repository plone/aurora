/**
 * The browser side of the Plone devtools. Load it from `entry.client.tsx`, in
 * development only, before hydrating:
 *
 * ```tsx
 * const devtools =
 *   import.meta.env.DEV && import.meta.env.PLONE_DEVTOOLS
 *     ? await import('@plone/devtools/client')
 *     : undefined;
 * devtools?.mountPloneDevtools();
 * // <HydratedRouter instrumentations={devtools ? [devtools.clientInstrumentation] : undefined} />
 * ```
 */
export { clientInstrumentation } from './instrumentation';
export { mountPloneDevtools } from './mount';
export { PloneDevtoolsPanel } from './panel/panel';
