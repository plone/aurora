/**
 * The browser side of the Plone devtools. Load it from `entry.client.tsx`, in
 * development only, before hydrating:
 *
 * ```tsx
 * let instrumentations: ClientInstrumentation[] | undefined;
 * if (import.meta.env.DEV && import.meta.env.PLONE_DEVTOOLS) {
 *   const devtools = await import('@plone/devtools/client');
 *   devtools.mountPloneDevtools();
 *   instrumentations = [devtools.clientInstrumentation];
 * }
 * // <HydratedRouter instrumentations={instrumentations} />
 * ```
 */
export { clientInstrumentation } from './instrumentation';
export { mountPloneDevtools } from './mount';
export { PloneDevtoolsPanel } from './panel/panel';
