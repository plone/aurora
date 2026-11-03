import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  // The build directory may be named by the environment, so a deployment can build
  // ASIDE into a versioned directory (for example build.live-<stamp>) and then swap a
  // symlink, instead of writing into the directory a running server is serving from —
  // `react-router build` removes its build directory before it writes. Unset, the
  // default `build` is unchanged.
  buildDirectory: process.env.REACT_ROUTER_BUILD_DIR || 'build',
} satisfies Config;
