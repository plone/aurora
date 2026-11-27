// Builds and runs `apps/aurora` outside the workspace, with the `@plone/*`
// packages as `pnpm pack` publishes them, to check that a project's app works
// with the published packages and nothing else.
//
// Inside the workspace, pnpm links the packages to their folders, so a file
// missing from a package, an undeclared dependency or an import into another
// package's folder still works. Outside, it doesn't.
//
// Usage, from the repository root, after `make build-deps` and
// `pnpm --filter @plone/controlpanels build:css`:
//
//   node packages/scripts/check-thin-app.js [--with-test-addon] [<work-dir>]
//
// `--with-test-addon` also packs the test add-on and builds with it, so the
// acceptance tests can run against the result. The work directory stays in
// place, to look at when something fails, or to start the server from:
//
//   cd <work-dir>/app && PLONE_API_PATH=http://localhost:55001/plone node server.js ./build/server/index.js
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const appDir = 'apps/aurora';
const args = process.argv.slice(2);
const withTestAddon = args.includes('--with-test-addon');
const [workDirArg] = args.filter((arg) => !arg.startsWith('--'));
const workDir = path.resolve(
  workDirArg ||
    fs.mkdtempSync(path.join(os.tmpdir(), 'plone-aurora-thin-app-')),
);
const tarballsDir = path.join(workDir, 'tarballs');
const projectDir = path.join(workDir, 'app');
const port = process.env.PORT || '3100';

// Packages of this repository that are never published, or not part of
// Plone Aurora.
const SKIP = new Set(['@plone/volto', '@plone/volto-slate', '@plone/scripts']);

function run(command, args, cwd) {
  console.log(`\n$ ${command} ${args.join(' ')}   (in ${cwd})`);
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

// 1. Pack every publishable package.
fs.rmSync(workDir, { recursive: true, force: true });
fs.mkdirSync(tarballsDir, { recursive: true });

const tarballs = {};
for (const dir of fs.readdirSync(path.join(repoRoot, 'packages')).sort()) {
  const packageDir = path.join(repoRoot, 'packages', dir);
  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) continue;
  const { name, private: isPrivate } = readJson(packageJsonPath);
  if (SKIP.has(name)) continue;
  if (isPrivate && !(withTestAddon && name === '@plone/test-addon')) continue;
  const before = new Set(fs.readdirSync(tarballsDir));
  run('pnpm', ['pack', '--pack-destination', tarballsDir], packageDir);
  const [tarball] = fs
    .readdirSync(tarballsDir)
    .filter((file) => !before.has(file));
  tarballs[name] = `file:${path.join(tarballsDir, tarball)}`;
}

// 2. Copy the app, as git tracks it, without its acceptance tests.
const files = execFileSync('git', ['ls-files', appDir], {
  cwd: repoRoot,
  encoding: 'utf-8',
})
  .split('\n')
  .filter(Boolean)
  .filter((file) => !file.startsWith(`${appDir}/acceptance/`));
for (const file of files) {
  const target = path.join(projectDir, path.relative(appDir, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, file), target);
}

// 3. Point the app's dependencies at the tarballs, and resolve the catalog.
const catalog = readJson(path.join(repoRoot, 'catalog.json'));
const packageJson = readJson(path.join(projectDir, 'package.json'));
for (const field of ['dependencies', 'devDependencies']) {
  for (const [name, range] of Object.entries(packageJson[field] || {})) {
    if (range.startsWith('workspace:')) {
      if (!tarballs[name]) {
        // A private package, such as the test add-on: not for projects.
        delete packageJson[field][name];
        continue;
      }
      packageJson[field][name] = tarballs[name];
    } else if (range === 'catalog:') {
      packageJson[field][name] = catalog[name];
    }
  }
}
writeJson(path.join(projectDir, 'package.json'), packageJson);

// The packages depend on each other by version, and these versions may not be
// on npm yet: resolve all of them to the tarballs. `pnpm-workspace.yaml` also
// keeps pnpm from looking for a workspace further up.
const workspace = [
  'overrides:',
  ...Object.entries(tarballs).map(
    ([name, tarball]) => `  '${name}': '${tarball}'`,
  ),
  'allowBuilds:',
  "  '@swc/core': true",
  "  '@tailwindcss/oxide': true",
  '  esbuild: true',
  '',
].join('\n');
fs.writeFileSync(path.join(projectDir, 'pnpm-workspace.yaml'), workspace);

// 4. Install, check the types, and build, as a project would. Build the app
// in the workspace too, to compare their CSS.
if (withTestAddon) process.env.PLONE_TEST_ADDON = '1';
run('pnpm', ['install', '--no-frozen-lockfile'], projectDir);
run('pnpm', ['run', 'typecheck'], projectDir);
run('pnpm', ['run', 'build'], projectDir);
run('pnpm', ['--filter', '@plone/aurora-dev', 'run', 'build'], repoRoot);

// Classes that Tailwind finds only in the workspace, in files that the packages
// don't publish, such as stories. Add a class here only after checking that no
// published file uses it.
const WORKSPACE_ONLY_CLASSES = new Set([
  // The words "start" and "end", which Tailwind takes for classes.
  'start',
  'end',
  // The stories of @plone/plate.
  'w-\\[600px\\]',
]);

// The class selectors of a built stylesheet, such as `assets/cmsui-<hash>.css`.
function cssClasses(buildDir, name) {
  const assets = path.join(buildDir, 'client', 'assets');
  const file = fs
    .readdirSync(assets)
    .find((f) => f.startsWith(`${name}-`) && f.endsWith('.css'));
  if (!file) return new Set();
  const css = fs.readFileSync(path.join(assets, file), 'utf-8');
  // A class starts with a letter, `_`, `-` or an escape: not `0.5rem`.
  const classes = css.matchAll(/\.(-?(?:[a-zA-Z_]|\\.)(?:\\.|[\w-])*)/g);
  return new Set([...classes].map((m) => m[1]));
}

// 5. Start the production server, and check that it serves the app.
const server = spawn('node', ['server.js', './build/server/index.js'], {
  cwd: projectDir,
  env: { ...process.env, PORT: port },
  stdio: 'inherit',
});

async function get(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(url);
      return { status: response.status, body: await response.text() };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`No answer from ${url}`);
}

let failed = false;
try {
  const ok = await get(`http://localhost:${port}/ok`);
  console.log(`\nGET /ok: ${ok.status}`);
  if (ok.status !== 200) failed = true;

  // Without a backend, the root route renders its error page: this checks
  // that server rendering works.
  const root = await get(`http://localhost:${port}/`);
  const rendered = root.body.includes('Did you start the backend?');
  console.log(`GET /: ${root.status}, error page rendered: ${rendered}`);
  if (!rendered) failed = true;

  // The client entry must not be empty: a side-effect import that a build
  // drops leaves an app that never hydrates.
  const assets = path.join(projectDir, 'build', 'client', 'assets');
  const entry = fs
    .readdirSync(assets)
    .find((file) => /^entry\.client-.*\.js$/.test(file));
  const entrySize = entry ? fs.statSync(path.join(assets, entry)).size : 0;
  console.log(`Client entry: ${entry} (${entrySize} bytes)`);
  if (entrySize < 10000) failed = true;

  // Tailwind generates the classes it finds in the files it scans. In the
  // workspace, it also scans the packages through their modules, which it
  // can't do in `node_modules`: a class missing outside means a package that
  // the generated `@source` entries miss. The workspace also puts the classes
  // of every module in every stylesheet, so a class counts as missing only
  // when no stylesheet outside has it.
  const stylesheets = ['publicui', 'cmsui'];
  const outside = new Set(
    stylesheets.flatMap((name) => [
      ...cssClasses(path.join(projectDir, 'build'), name),
    ]),
  );
  for (const name of stylesheets) {
    const inside = cssClasses(path.join(repoRoot, appDir, 'build'), name);
    const missing = [...inside].filter(
      (c) => !outside.has(c) && !WORKSPACE_ONLY_CLASSES.has(c),
    );
    console.log(
      `${name} CSS: ${inside.size} classes in the workspace, ${missing.length} missing outside`,
    );
    if (missing.length) console.log(`  missing: ${missing.join(' ')}`);
    if (inside.size === 0 || missing.length > 0) failed = true;
  }
} finally {
  server.kill();
}

if (failed) {
  console.error(`\nThe app doesn't work outside the workspace: see ${workDir}`);
  process.exit(1);
}
console.log(`\nThe app works outside the workspace (${workDir}).`);
