import type { Config } from '@react-router/dev/config';

// React Router aborts an action whose `Origin` header doesn't match the origin
// of the request URL. Behind a proxy that terminates TLS, `react-router-serve`
// sees the request as `http` while the browser sends an `https` origin, so every
// action (login included) fails with a 400. The hosts listed here, comma
// separated and with `*`/`**` wildcards, are accepted as action origins. The
// list is read when building, and unset it allows only same-origin actions.
const allowedActionOrigins =
  process.env.REACT_ROUTER_ALLOWED_ACTION_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export default {
  ssr: true,
  // The build directory may be named by the environment, so a deployment can build
  // ASIDE into a versioned directory (for example build.live-<stamp>) and then swap a
  // symlink, instead of writing into the directory a running server is serving from —
  // `react-router build` removes its build directory before it writes. Unset, the
  // default `build` is unchanged.
  buildDirectory: process.env.REACT_ROUTER_BUILD_DIR || 'build',
  ...(allowedActionOrigins?.length ? { allowedActionOrigins } : {}),
} satisfies Config;
