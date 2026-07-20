import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();

const TARGETS = [
  {
    id: 'components',
    owner: '@plone/components',
    packageDir: 'packages/components',
    configFile: 'apps/aurora/vite.config.ts',
    sourceRoots: ['src'],
  },
  {
    id: 'helpers',
    owner: '@plone/helpers',
    packageDir: 'packages/helpers',
    configFile: 'apps/aurora/vite.config.ts',
    sourceRoots: ['src'],
  },
  {
    id: 'cmsui',
    owner: '@plone/cmsui',
    packageDir: 'packages/cmsui',
    configFile: 'packages/cmsui/vite.extend.js',
  },
  {
    id: 'layout',
    owner: '@plone/layout',
    packageDir: 'packages/layout',
    configFile: 'packages/layout/vite.extend.js',
  },
  {
    id: 'plate',
    owner: '@plone/plate',
    packageDir: 'packages/plate',
    configFile: 'packages/plate/vite.extend.js',
  },
];

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function shouldIgnoreFile(relativePath) {
  const normalized = toPosix(relativePath);

  return (
    normalized.includes('/dist/') ||
    normalized.includes('/.storybook/') ||
    normalized.includes('/coverage/') ||
    normalized.includes('/news/') ||
    normalized.includes('/node_modules/') ||
    normalized.includes('/acceptance/') ||
    normalized.includes('/__tests__/') ||
    normalized.endsWith('.test.js') ||
    normalized.endsWith('.test.jsx') ||
    normalized.endsWith('.test.ts') ||
    normalized.endsWith('.test.tsx') ||
    normalized.endsWith('.spec.js') ||
    normalized.endsWith('.spec.jsx') ||
    normalized.endsWith('.spec.ts') ||
    normalized.endsWith('.spec.tsx') ||
    normalized.endsWith('.stories.js') ||
    normalized.endsWith('.stories.jsx') ||
    normalized.endsWith('.stories.ts') ||
    normalized.endsWith('.stories.tsx') ||
    normalized.endsWith('.story.js') ||
    normalized.endsWith('.story.jsx') ||
    normalized.endsWith('.story.ts') ||
    normalized.endsWith('.story.tsx') ||
    normalized.endsWith('/vite.config.js') ||
    normalized.endsWith('/vite.config.ts') ||
    normalized.endsWith('/vitest.config.js') ||
    normalized.endsWith('/vitest.config.ts') ||
    normalized.endsWith('/tsup.config.js') ||
    normalized.endsWith('/tsup.config.ts') ||
    normalized.endsWith('/vite.extend.js') ||
    normalized.endsWith('/vite.extend.ts') ||
    normalized.endsWith('/setupTesting.js') ||
    normalized.endsWith('/setupTesting.ts')
  );
}

function listFiles(rootDir, sourceRoots = ['']) {
  const results = [];
  const stack = sourceRoots.length > 0 ? [...sourceRoots] : [''];

  while (stack.length) {
    const current = stack.pop();
    const absoluteCurrent = path.join(rootDir, current);
    const entries = fs.readdirSync(absoluteCurrent, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = current
        ? path.join(current, entry.name)
        : entry.name;

      if (entry.isDirectory()) {
        if (shouldIgnoreFile(relativePath)) {
          continue;
        }
        stack.push(relativePath);
        continue;
      }

      if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        continue;
      }

      if (shouldIgnoreFile(relativePath)) {
        continue;
      }

      results.push(relativePath);
    }
  }

  return results;
}

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function getWorkspacePackages() {
  const packageFiles = [];
  for (const rootName of ['apps', 'packages']) {
    const rootDir = path.join(repoRoot, rootName);
    for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const packageFile = path.join(rootName, entry.name, 'package.json');
      if (fs.existsSync(path.join(repoRoot, packageFile))) {
        packageFiles.push(packageFile);
      }
    }
  }

  return new Set(
    packageFiles.map((file) => loadJson(file).name).filter(Boolean),
  );
}

function getPackageBase(specifier) {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/');
    return name ? `${scope}/${name}` : specifier;
  }
  const [name] = specifier.split('/');
  return name;
}

function isRelative(specifier) {
  return specifier.startsWith('.') || specifier.startsWith('/');
}

function isRuntimeImport(node) {
  const clause = node.importClause;
  if (!clause) {
    return true;
  }
  if (clause.isTypeOnly) {
    return false;
  }
  if (clause.name) {
    return true;
  }
  if (!clause.namedBindings) {
    return false;
  }
  if (ts.isNamespaceImport(clause.namedBindings)) {
    return true;
  }
  return clause.namedBindings.elements.some((element) => !element.isTypeOnly);
}

function isRuntimeExport(node) {
  if (node.isTypeOnly) {
    return false;
  }
  const clause = node.exportClause;
  if (!clause) {
    // `export * from 'pkg'`
    return true;
  }
  if (ts.isNamespaceExport(clause)) {
    // `export * as ns from 'pkg'`
    return true;
  }
  // `export { a, type b } from 'pkg'` — only a type-only re-export list
  // (every element marked `type`) should be treated as a non-runtime export.
  return clause.elements.some((element) => !element.isTypeOnly);
}

function isServerOnlyFile(relativeFile) {
  return /\.server\.(js|jsx|ts|tsx)$/.test(toPosix(relativeFile));
}

function normalizeSpecifier(specifier) {
  return specifier.replace(/\?.*$/, '');
}

function shouldIncludeSpecifier(
  specifier,
  directDependencies,
  workspacePackages,
) {
  if (!specifier || isRelative(specifier) || specifier.startsWith('node:')) {
    return false;
  }

  const base = getPackageBase(specifier);
  if (workspacePackages.has(base)) {
    return false;
  }

  return directDependencies.has(base);
}

function collectSpecifiers(packageDir, directDependencies, workspacePackages) {
  const target = TARGETS.find((item) => item.packageDir === packageDir);
  const files = listFiles(
    path.join(repoRoot, packageDir),
    target?.sourceRoots ?? [''],
  );

  // Track, per specifier, whether it was seen from a client-reachable file
  // and/or from a `*.server.*` file — only specifiers seen exclusively from
  // `*.server.*` files belong in ssr.optimizeDeps.include; anything else
  // (client-only, or used from both) belongs in optimizeDeps.include.
  const seenFrom = new Map();

  const record = (specifier, isServerFile) => {
    const entry = seenFrom.get(specifier) ?? { client: false, server: false };
    if (isServerFile) {
      entry.server = true;
    } else {
      entry.client = true;
    }
    seenFrom.set(specifier, entry);
  };

  for (const relativeFile of files) {
    const absoluteFile = path.join(repoRoot, packageDir, relativeFile);
    if (!SOURCE_EXTENSIONS.has(path.extname(absoluteFile))) {
      continue;
    }

    const isServerFile = isServerOnlyFile(relativeFile);
    const sourceText = fs.readFileSync(absoluteFile, 'utf8');
    const sourceFile = ts.createSourceFile(
      absoluteFile,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      absoluteFile.endsWith('.tsx') || absoluteFile.endsWith('.jsx')
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS,
    );

    const visit = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        isRuntimeImport(node)
      ) {
        const specifier = normalizeSpecifier(node.moduleSpecifier.text);
        if (
          shouldIncludeSpecifier(
            specifier,
            directDependencies,
            workspacePackages,
          )
        ) {
          record(specifier, isServerFile);
        }
      }

      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        isRuntimeExport(node)
      ) {
        const specifier = normalizeSpecifier(node.moduleSpecifier.text);
        if (
          shouldIncludeSpecifier(
            specifier,
            directDependencies,
            workspacePackages,
          )
        ) {
          record(specifier, isServerFile);
        }
      }

      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const specifier = normalizeSpecifier(node.arguments[0].text);
        if (
          shouldIncludeSpecifier(
            specifier,
            directDependencies,
            workspacePackages,
          )
        ) {
          record(specifier, isServerFile);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  const client = [];
  const serverOnly = [];
  for (const [specifier, seen] of seenFrom) {
    (seen.client ? client : serverOnly).push(specifier);
  }

  return {
    client: client.sort((a, b) => a.localeCompare(b)),
    serverOnly: serverOnly.sort((a, b) => a.localeCompare(b)),
  };
}

function isPropertyNamed(node, name) {
  return (
    (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
    ts.isIdentifier(node.name) &&
    node.name.text === name
  );
}

// Only entries actually declared in an `include` array count as declared —
// entries in a sibling `exclude` array must not be treated as covered.
function collectDeclaredEntries(configFile, owner) {
  const contents = fs.readFileSync(path.join(repoRoot, configFile), 'utf8');
  const sourceFile = ts.createSourceFile(
    configFile,
    contents,
    ts.ScriptTarget.Latest,
    true,
    configFile.endsWith('.ts') || configFile.endsWith('.tsx')
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JS,
  );

  const prefix = `${owner} > `;
  const client = new Set();
  const ssr = new Set();

  const visit = (node, ancestorNames) => {
    if (
      isPropertyNamed(node, 'include') &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      const target = ancestorNames.includes('ssr') ? ssr : client;
      for (const element of node.initializer.elements) {
        if (
          ts.isStringLiteralLike(element) &&
          element.text.startsWith(prefix)
        ) {
          target.add(element.text.slice(prefix.length));
        }
      }
    }

    const nextAncestors =
      (ts.isPropertyAssignment(node) ||
        ts.isShorthandPropertyAssignment(node)) &&
      ts.isIdentifier(node.name)
        ? [...ancestorNames, node.name.text]
        : ancestorNames;

    ts.forEachChild(node, (child) => visit(child, nextAncestors));
  };

  visit(sourceFile, []);

  return {
    client: [...client].sort((a, b) => a.localeCompare(b)),
    ssr: [...ssr].sort((a, b) => a.localeCompare(b)),
  };
}

function diffEntries(expected, declared) {
  const expectedSet = new Set(expected);
  const declaredSet = new Set(declared);

  return {
    missing: expected.filter((entry) => !declaredSet.has(entry)),
    extra: declared.filter((entry) => !expectedSet.has(entry)),
  };
}

function formatEntries(owner, entries) {
  return entries.map((entry) => `        '${owner} > ${entry}',`).join('\n');
}

const workspacePackages = getWorkspacePackages();

const results = TARGETS.map((target) => {
  const packageJson = loadJson(path.join(target.packageDir, 'package.json'));
  const directDependencies = new Set(
    Object.keys(packageJson.dependencies ?? {}),
  );

  const expected = collectSpecifiers(
    target.packageDir,
    directDependencies,
    workspacePackages,
  );
  const declared = collectDeclaredEntries(target.configFile, target.owner);
  const clientDiff = diffEntries(expected.client, declared.client);
  const ssrDiff = diffEntries(expected.serverOnly, declared.ssr);

  return {
    ...target,
    expected,
    declared,
    clientDiff,
    ssrDiff,
  };
});

let hasDiff = false;
const reportedOk = new Set();

function reportSection(label, owner, diff, suggested) {
  let printed = false;

  if (diff.missing.length) {
    console.log(`  Missing ${label} entries:`);
    for (const entry of diff.missing) {
      console.log(`    ${owner} > ${entry}`);
    }
    printed = true;
  }

  if (diff.extra.length) {
    console.log(`  Extra ${label} entries:`);
    for (const entry of diff.extra) {
      console.log(`    ${owner} > ${entry}`);
    }
    printed = true;
  }

  if (printed && suggested.length) {
    console.log(`  Suggested ${label} block:`);
    console.log(formatEntries(owner, suggested));
  }
}

for (const result of results) {
  const clientOk =
    !result.clientDiff.missing.length && !result.clientDiff.extra.length;
  const ssrOk = !result.ssrDiff.missing.length && !result.ssrDiff.extra.length;

  if (clientOk && ssrOk) {
    if (!reportedOk.has(result.configFile)) {
      console.log(`OK ${result.configFile}`);
      reportedOk.add(result.configFile);
    }
    continue;
  }

  hasDiff = true;
  console.log(`CHECK ${result.configFile}`);

  if (!clientOk) {
    reportSection(
      'optimizeDeps.include',
      result.owner,
      result.clientDiff,
      result.expected.client,
    );
  }

  if (!ssrOk) {
    reportSection(
      'ssr.optimizeDeps.include',
      result.owner,
      result.ssrDiff,
      result.expected.serverOnly,
    );
  }
}

if (hasDiff) {
  process.exitCode = 1;
}
