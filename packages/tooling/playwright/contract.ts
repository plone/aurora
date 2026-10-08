import type { Page } from '@playwright/test';

/**
 * Block content classname contract (plone/aurora#200). In the public view,
 * every class inside the rendered content must be one of the stable hooks
 * themes rely on, never a Tailwind utility: public themes don't have to load
 * Tailwind, so utilities would leave the content unstyled.
 */

/** The contract: Plate node classes and the block anatomy. */
const CONTRACT = [
  /^slate-[\w-]+$/, // Plate: `slate-<type>`, `slate-indent-<n>`, …
  /^block$/,
  /^block-[\w-]+$/, // `block-<type>`, `block-inner-container`
  /^block-[\w-]+__[\w-]+$/, // inner parts: `block-<type>__<part>`
  /^category-[\w-]+$/,
];

/** Classes from third-party code that render inside the content. */
const THIRD_PARTY = [
  /^hljs-[\w-]+$/, // highlight.js tokens in code blocks
  /^function_$/, // highlight.js scope modifier
  /^lucide(-[\w-]+)?$/, // icons
  /^react-aria-[\w-]+$/, // React Aria Components (links)
  /^responsive$/, // `@plone/layout`'s `Image` component
];

async function contentClasses(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-slate-editor]')!;
    const byOwner: Record<string, Set<string>> = {};
    // The owner is the nearest Plate node with a `slate-<type>` class (or a
    // block type), walking up from the element itself.
    const ownerOf = (el: Element) => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        if (node === root) return 'editor';
        const slateClass = [...node.classList].find((c) =>
          /^slate-[a-z_]+$/.test(c),
        );
        if (slateClass) return slateClass.replace(/^slate-/, '');
        const blockType = (node as HTMLElement).dataset.blockType;
        if (blockType) return blockType;
      }
      return 'editor';
    };
    [root, ...root.querySelectorAll('[class]')].forEach((el) => {
      const owner = ownerOf(el);
      el.classList.forEach((c) => (byOwner[owner] ||= new Set()).add(c));
    });
    return Object.fromEntries(
      Object.entries(byOwner).map(([owner, classes]) => [
        owner,
        [...classes].sort(),
      ]),
    );
  });
}

/**
 * The classes outside the contract in the rendered content, by the block or
 * Plate node that renders them. An empty object means the content only uses
 * contract classnames.
 */
export async function contractViolations(page: Page) {
  const allowed = [...CONTRACT, ...THIRD_PARTY];
  return Object.fromEntries(
    Object.entries(await contentClasses(page))
      .map(([owner, classes]) => [
        owner,
        classes.filter((c) => !allowed.some((re) => re.test(c))),
      ])
      .filter(([, classes]) => classes.length),
  );
}
