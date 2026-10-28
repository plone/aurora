// Builds `dist/controlpanels.css` from `src/styles/controlpanels.css`, for
// apps without Tailwind (see that file). Tailwind compiles the classes of this
// package and of the Quanta components it renders. Then every rule is scoped
// to `.plone-controlpanels`, without adding to its specificity, and the
// cascade layers are removed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import postcss from 'postcss';

const SCOPE = ':where(.plone-controlpanels)';
const INPUT = 'src/styles/controlpanels.css';
const OUTPUT = 'dist/controlpanels.css';
const COMPILED = 'dist/controlpanels.compiled.css';

mkdirSync('dist', { recursive: true });
execFileSync('tailwindcss', ['-i', INPUT, '-o', COMPILED, '--minify'], {
  stdio: 'inherit',
});

// The document's root and body are the scope itself.
const ROOT = /^(:root|:host|html|body)\b/;

const scope = (selector) =>
  ROOT.test(selector) ? selector.replace(ROOT, SCOPE) : `${SCOPE} ${selector}`;

const root = postcss.parse(readFileSync(COMPILED, 'utf8'));
root.walkAtRules('layer', (rule) => {
  if (rule.nodes) rule.replaceWith(rule.nodes);
  else rule.remove();
});
root.walkRules((rule) => {
  if (
    rule.parent?.type === 'atrule' &&
    rule.parent.name.endsWith('keyframes')
  ) {
    return;
  }
  rule.selectors = rule.selectors.map(scope);
});
writeFileSync(OUTPUT, root.toString());
rmSync(COMPILED);
console.log(`Wrote ${OUTPUT}`);
