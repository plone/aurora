/* eslint-disable no-console */
// The production server. It does what `react-router-serve` does (compression,
// static assets, request logging and the React Router request handler), and
// also trusts the reverse proxy in front of it.
//
// Behind a proxy that terminates TLS, the request reaches this server as plain
// `http`. Without `trust proxy`, Express ignores `X-Forwarded-Proto`, the
// request URL is built as `http://…` while the browser sends an `https://…`
// `Origin`, and React Router aborts every action (login included) with a 400.
// Trusting the proxy makes the request URL match what the browser sees, for any
// host the site is served on, with nothing to configure per deployment.
//
// Usage: node server.js <server-build-path>
//
// Environment:
// - `PORT` and `HOST`: where to listen (default `3000` on all interfaces).
// - `TRUST_PROXY`: which proxies to trust, in Express's `trust proxy` syntax.
//   It defaults to the private networks (`loopback, linklocal, uniquelocal`),
//   where a proxy in front of a container usually connects from. Set it to
//   `false` to trust no proxy.
// - `REACT_ROUTER_ALLOWED_ACTION_ORIGINS`: extra hosts allowed to submit
//   actions from another origin, comma separated, with `*`/`**` wildcards.
//   Read when the server starts.
import path from 'node:path';
import url from 'node:url';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';
process.setSourceMapsEnabled(true);

// Imported after `NODE_ENV` is set: it loads React, which picks its development
// or production build from `NODE_ENV`, and the server build must get the same one.
const { createRequestHandler } = await import('@react-router/express');

const DEFAULT_TRUST_PROXY = 'loopback, linklocal, uniquelocal';

/**
 * Parse `TRUST_PROXY` into a value for Express's `trust proxy` setting.
 * @param {string | undefined} value
 * @returns {boolean | number | string}
 */
function parseTrustProxy(value = DEFAULT_TRUST_PROXY) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false' || trimmed === '') return false;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

/**
 * Parse a comma separated list of hosts.
 * @param {string | undefined} value
 * @returns {string[] | undefined}
 */
function parseHosts(value) {
  const hosts = value
    ?.split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  return hosts?.length ? hosts : undefined;
}

/**
 * The URL path the assets are served from, taken from the build's public path.
 * @param {string} publicPath
 */
function getExpressPath(publicPath) {
  let pathname;
  try {
    pathname = new URL(publicPath).pathname;
  } catch {
    pathname = publicPath;
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

const buildPathArg = process.argv[2];
if (!buildPathArg) {
  console.error(
    'Usage: node server.js <server-build-path>, for example node server.js build/server/index.js',
  );
  process.exit(1);
}

const buildPath = path.resolve(buildPathArg);
const buildModule = await import(url.pathToFileURL(buildPath).href);
const allowedActionOrigins = parseHosts(
  process.env.REACT_ROUTER_ALLOWED_ACTION_ORIGINS,
);
const build = allowedActionOrigins
  ? { ...buildModule, allowedActionOrigins }
  : buildModule;

const assetsBuildDirectory = path.resolve(
  process.cwd(),
  build.assetsBuildDirectory,
);
const expressPublicPath = getExpressPath(build.publicPath);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
app.use(compression());
app.use(
  path.posix.join(expressPublicPath, 'assets'),
  express.static(path.join(assetsBuildDirectory, 'assets'), {
    immutable: true,
    maxAge: '1y',
  }),
);
app.use(expressPublicPath, express.static(assetsBuildDirectory));
app.use(express.static('public', { maxAge: '1h' }));
app.use(morgan('tiny'));
app.all(
  '/{*splat}',
  createRequestHandler({ build, mode: process.env.NODE_ENV }),
);

const port = Number(process.env.PORT) || 3000;
const onListen = () => {
  console.log(
    `[aurora] listening on http://${process.env.HOST || 'localhost'}:${port}`,
  );
};
const server = process.env.HOST
  ? app.listen(port, process.env.HOST, onListen)
  : app.listen(port, onListen);

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.once(signal, () =>
    server.close((error) => error && console.error(error)),
  );
});
