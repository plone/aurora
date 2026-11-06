/**
 * Plone's light palette for TanStack Devtools' own frame (header, plugin
 * strip, workspace and plugin tabs), which is beige in TanStack's light
 * theme. Dark mode keeps TanStack's colors.
 *
 * It targets the frame's `data-testid` and `data-tsd-*` hooks, under the
 * theme attribute TanStack sets on `<html>`. If a TanStack update renames a
 * hook, that part of the frame goes back to TanStack's colors; nothing else
 * breaks. Check it when bumping the pinned TanStack versions.
 */
const STYLE_ID = 'plone-devtools-frame';

const frame = `html[data-tanstack-devtools-theme='light'] [data-testid='tanstack_devtools']`;

const css = `
${frame} [data-testid='workbench-header'],
${frame} [data-testid='plugins-strip'],
${frame} [data-testid='plugins-workspace'],
${frame} [data-testid='workbench-collapse-toggle'] {
  background-color: #f1f6f9;
  color: #33495a;
}
${frame} [data-testid='workbench-header'] {
  border-bottom: 1px solid #dbe5ec;
}
${frame} [data-testid='workbench-header'] button,
${frame} [data-testid='plugins-workspace'] button {
  color: #33495a;
}
${frame} [data-testid='workbench-header'] [data-tsd-selected='true'] {
  background-color: #dcebf3;
  color: #00587c;
}
${frame} [data-testid='plugins-workspace'] [data-tsd-selected='true'] {
  background-color: #e6f3f9;
  border-radius: 12px;
  padding: 0 2px 0 6px;
}
${frame} [data-testid='plugins-workspace'] [data-tsd-selected='true'] button {
  color: #00587c;
  font-weight: 500;
}
`;

export function installFrameStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.append(style);
}
