import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

/**
 * Helpers to check that block content styles don't depend on a particular
 * reset: a public theme may use Tailwind's preflight, another reset, or none.
 */

/**
 * Removes every rule in the top-level `base` layer, where the public theme's
 * reset lives (Tailwind's preflight, for Agave). Returns how many it removed.
 */
export const removeBaseLayer = (page: Page) =>
  page.evaluate(() => {
    let removed = 0;
    const strip = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSLayerBlockRule && rule.name === 'base') {
          while (rule.cssRules.length) {
            rule.deleteRule(0);
            removed++;
          }
        } else if (rule instanceof CSSImportRule && rule.styleSheet) {
          strip(rule.styleSheet.cssRules);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        strip(sheet.cssRules);
      } catch {
        // Cross-origin stylesheets (web fonts) can't be read.
      }
    }
    return removed;
  });

/**
 * The margin of a plain element of the given tag, which no block styles
 * target: it shows which reset is in effect.
 */
export const plainElementMargin = (page: Page, tagName: string) =>
  page.evaluate((tag) => {
    const element = document.createElement(tag);
    document.body.append(element);
    const { margin } = getComputedStyle(element);
    element.remove();
    return margin;
  }, tagName);

/**
 * A real non-Tailwind reset, `@plone/theming`'s simple reset, moved into the
 * `base` layer where themes are expected to put their reset. In it, a plain
 * `h1` has a `21.44px 0px` margin.
 */
export const SIMPLE_RESET = readFileSync(
  fileURLToPath(
    new URL('../../theming/styles/simple/reset.css', import.meta.url),
  ),
  'utf-8',
).replace('@layer reset {', '@layer base {');

/**
 * The computed values of the given properties, per selector, inside the
 * rendered content. A selector that matches nothing gives `null`.
 */
export const measureOwnedStyles = (
  page: Page,
  owned: Record<string, string[]>,
) =>
  page.evaluate((ownedStyles) => {
    return Object.fromEntries(
      Object.entries(ownedStyles).map(([selector, properties]) => {
        const element = document.querySelector(
          `[data-slate-editor] ${selector}`,
        );
        if (!element) return [selector, null];
        const style = getComputedStyle(element);
        return [
          selector,
          Object.fromEntries(
            properties.map((property) => [
              property,
              style.getPropertyValue(property),
            ]),
          ),
        ];
      }),
    );
  }, owned);
