import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { EDITORIAL_MARKS, INLINE_MARKS } from '../fixtures/inline-marks';
import { ALL_NATIVE_BLOCK_SECTIONS } from '../fixtures/native-blocks';
import { createNativeBlocksPage, openInView } from '../fixtures/pages';

// Block content classname contract (plone/aurora#200). In the public view,
// every class inside the rendered content must be one of the stable hooks
// themes rely on, never a Tailwind utility: public themes don't have to load
// Tailwind, so utilities would leave the content unstyled.

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

async function violations(page: Page) {
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

test('the public content only uses contract classnames', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ALL_NATIVE_BLOCK_SECTIONS);
  await openInView(page, pageId);

  expect(await violations(page)).toEqual({});
});

test('inline marks only use contract classnames', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [...INLINE_MARKS, ...EDITORIAL_MARKS],
  });
  await openInView(page, pageId);

  expect(await violations(page)).toEqual({});

  // Comments and suggestions are editorial: the public view shows their text
  // as plain text, without highlight or insert/delete markup.
  const editor = page.locator('[data-slate-editor]');
  await expect(editor.locator('del, ins')).toHaveCount(0);
  await expect(editor.getByText('removed')).toBeVisible();
  await expect(editor.getByText('commented', { exact: true })).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
});

test('lists render their contract hooks', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['lists']);
  await openInView(page, pageId);

  const bulleted = page.locator('.block-p[data-list-style-type="disc"]');
  await expect(bulleted.first()).toBeAttached();
  await expect(
    bulleted.first().locator('ul.block-p__list > li.block-p__item'),
  ).toBeAttached();
  await expect(
    page
      .locator('.block-p[data-list-style-type="decimal"]')
      .first()
      .locator('ol.block-p__list > li.block-p__item'),
  ).toBeAttached();
});
