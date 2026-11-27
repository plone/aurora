import type { Config } from '@react-router/dev/config';
import { ploneAurora } from '@plone/aurora/preset';

export default {
  ssr: true,
  // Generates the Plone registry files, including the add-ons' routes, before
  // React Router reads `app/routes.ts`.
  presets: [ploneAurora()],
  // The build directory may be named by the environment, so a deployment can build
  // ASIDE into a versioned directory (for example build.live-<stamp>) and then swap a
  // symlink, instead of writing into the directory a running server is serving from —
  // `react-router build` removes its build directory before it writes. Unset, the
  // default `build` is unchanged.
  buildDirectory: process.env.REACT_ROUTER_BUILD_DIR || 'build',
} satisfies Config;
