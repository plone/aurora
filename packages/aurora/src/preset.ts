import type { Preset } from '@react-router/dev/config';
import { initPloneRegistryLoaders } from '@plone/registry/init-loaders';

/**
 * The React Router preset of a Plone Aurora app. Add it to the app's
 * `react-router.config.ts`:
 *
 * ```ts
 * import type { Config } from '@react-router/dev/config';
 * import { ploneAurora } from '@plone/aurora/preset';
 *
 * export default {
 *   ssr: true,
 *   presets: [ploneAurora()],
 * } satisfies Config;
 * ```
 *
 * Before React Router evaluates the app's `routes.ts`, it generates the files
 * of the Plone registry in the app's `.plone` folder, including the routes
 * that the add-ons register. So `react-router dev`, `react-router build` and
 * `react-router typegen` work on their own, without running `init-loaders`
 * first.
 */
export function ploneAurora(): Preset {
  return {
    name: '@plone/aurora',
    async reactRouterConfig() {
      await initPloneRegistryLoaders();
      return {};
    },
  };
}
