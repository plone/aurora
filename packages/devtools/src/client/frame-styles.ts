/**
 * Plone's light palette for TanStack Devtools' own frame (header, plugin
 * strip, workspace and plugin tabs), which is beige in TanStack's light
 * theme. Dark mode keeps TanStack's colors. In both themes, the header shows
 * the Aurora logo (its 16px drawing) and "Aurora Devtools" instead of
 * TanStack's logo and name.
 *
 * It targets the frame's `data-testid` and `data-tsd-*` hooks, under the
 * theme attribute TanStack sets on `<html>`. If a TanStack update renames a
 * hook, that part of the frame goes back to TanStack's colors; nothing else
 * breaks. Check it when bumping the pinned TanStack versions.
 */
import { auroraLogo } from './logo';

const STYLE_ID = 'plone-devtools-frame';

const frame = `html[data-tanstack-devtools-theme='light'] [data-testid='tanstack_devtools']`;

const css = `
/*
 * The button that opens the devtools, which shows the Aurora logo (see
 * \`mount.tsx\`). TanStack places it from its size at first render, before
 * the logo is mounted; without a size here it is placed as an 8px button
 * and the logo ends up off-screen.
 */
[data-testid='tanstack_devtools'] > button[data-tsd-control] {
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 50%;
}
[data-testid='tanstack_devtools'] [data-testid='workbench-logo'] {
  width: 16px;
  height: 16px;
  background: url("${auroraLogo.tuned16}") center / 16px 16px no-repeat;
}
[data-testid='tanstack_devtools'] [data-testid='workbench-logo'] > * {
  display: none;
}
/* The header title: "Aurora Devtools" instead of "TanStack Devtools". */
[data-testid='tanstack_devtools'] [data-testid='workbench-wordmark'] {
  /* No size and no line for the original text, so it takes no room. */
  font-size: 0;
  line-height: 0;
  letter-spacing: 0;
}
[data-testid='tanstack_devtools'] [data-testid='workbench-wordmark']::after {
  content: 'Aurora Devtools';
  display: block;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: -0.14px;
}
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
