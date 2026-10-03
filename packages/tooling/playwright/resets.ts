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
