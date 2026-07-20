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

  const specifiers = new Set();

  for (const relativeFile of files) {
    const absoluteFile = path.join(repoRoot, packageDir, relativeFile);
    if (!SOURCE_EXTENSIONS.has(path.extname(absoluteFile))) {
      continue;
    }

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
          specifiers.add(specifier);
        }
      }

      if (
        ts.isExportDeclaration(node) &&
        !node.isTypeOnly &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const specifier = normalizeSpecifier(node.moduleSpecifier.text);
        if (
          shouldIncludeSpecifier(
            specifier,
            directDependencies,
            workspacePackages,
          )
        ) {
          specifiers.add(specifier);
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
          specifiers.add(specifier);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return [...specifiers].sort((a, b) => a.localeCompare(b));
}

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

  const declared = new Set();

  const visit = (node) => {
    if (ts.isStringLiteralLike(node)) {
      const prefix = `${owner} > `;
      if (node.text.startsWith(prefix)) {
        declared.add(node.text.slice(prefix.length));
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return [...declared].sort((a, b) => a.localeCompare(b));
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
  const { missing, extra } = diffEntries(expected, declared);

  return {
    ...target,
    expected,
    declared,
    missing,
    extra,
  };
});

let hasDiff = false;
const reportedOk = new Set();

for (const result of results) {
  if (!result.missing.length && !result.extra.length) {
    if (!reportedOk.has(result.configFile)) {
      console.log(`OK ${result.configFile}`);
      reportedOk.add(result.configFile);
    }
    continue;
  }

  hasDiff = true;
  console.log(`CHECK ${result.configFile}`);

  if (result.missing.length) {
    console.log('  Missing entries:');
    for (const entry of result.missing) {
      console.log(`    ${result.owner} > ${entry}`);
    }
  }

  if (result.extra.length) {
    console.log('  Extra entries:');
    for (const entry of result.extra) {
      console.log(`    ${result.owner} > ${entry}`);
    }
  }

  console.log('  Suggested include block:');
  console.log(formatEntries(result.owner, result.expected));
}

if (hasDiff) {
  process.exitCode = 1;
}
