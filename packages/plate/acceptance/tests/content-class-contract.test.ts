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

/**
 * Classes outside the contract that are still waiting to be converted, by the
 * Plate node that renders them. This list may only shrink: each conversion
 * phase removes its entries, and the test fails both on new classes and on
 * entries that no longer render, so the list always matches reality.
 */
const PENDING: Record<string, string[]> = {
  editor: [
    '**:data-slate-placeholder:!top-1/2',
    '**:data-slate-placeholder:-translate-y-1/2',
    '**:data-slate-placeholder:opacity-100!',
    '**:data-slate-placeholder:text-muted-foreground/80',
    '[&_[data-slate-node="element"]:not([data-slate-inline="true"])]:mx-auto',
    '[&_strong]:font-bold',
    'break-words',
    'cursor-text',
    'focus-visible:outline-none',
    'group/editor',
    'overflow-x-hidden',
    'overflow-y-hidden',
    'placeholder:text-muted-foreground/80',
    'relative',
    'ring-offset-background',
    'rounded-md',
    'select-text',
    'w-full',
    'whitespace-pre-wrap',
  ],
  table: [
    'border-collapse',
    'group/table',
    'h-px',
    'min-w-full',
    'ml-px',
    'mr-0',
    'overflow-x-auto',
    'overflow-y-hidden',
    'py-5',
    'relative',
    'table',
    'table-fixed',
    'w-fit',
  ],
  tr: ['h-full'],
  th: [
    '*:m-0',
    'before:absolute',
    'before:border-b',
    'before:border-b-border',
    'before:border-l',
    'before:border-l-border',
    'before:border-r',
    'before:border-r-border',
    'before:border-t',
    'before:border-t-border',
    'before:box-border',
    "before:content-['']",
    'before:select-none',
    'before:size-full',
    'bg-background',
    'border-none',
    'box-border',
    'font-normal',
    'h-full',
    'overflow-visible',
    'p-0',
    'px-4',
    'py-2',
    'relative',
    'text-left',
    'z-20',
  ],
  td: [
    'before:absolute',
    'before:border-b',
    'before:border-b-border',
    'before:border-l',
    'before:border-l-border',
    'before:border-r',
    'before:border-r-border',
    'before:box-border',
    "before:content-['']",
    'before:select-none',
    'before:size-full',
    'bg-background',
    'border-none',
    'box-border',
    'h-full',
    'overflow-visible',
    'p-0',
    'px-4',
    'py-2',
    'relative',
    'z-20',
  ],
  callout: [
    'bg-muted',
    'flex',
    'gap-2',
    'my-1',
    'p-4',
    'pl-3',
    'rounded-md',
    'rounded-sm',
    'select-none',
    'size-6',
    'text-[18px]',
    'w-full',
  ],
  toggle: [
    '-left-0.5',
    '[&_svg]:size-4',
    'absolute',
    'cursor-pointer',
    'duration-75',
    'hover:bg-accent',
    'items-center',
    'justify-center',
    'p-px',
    'pl-6',
    'relative',
    'rotate-0',
    'rounded-md',
    'select-none',
    'size-6',
    'text-muted-foreground',
    'top-0',
    'transition-colors',
    'transition-transform',
  ],
  column_group: [
    'flex',
    'group/column',
    'mb-2',
    'relative',
    'rounded',
    'size-full',
  ],
  column: [
    'border',
    'border-transparent',
    'group-first/column:pl-0',
    'group-last/column:pr-0',
    'h-full',
    'p-1.5',
    'pt-2',
    'px-2',
    'relative',
  ],
  toc: [
    "[&_svg:not([class*='size-'])]:size-4",
    '[&_svg]:pointer-events-none',
    '[&_svg]:shrink-0',
    'aria-invalid:border-destructive',
    'aria-invalid:ring-destructive/20',
    'cursor-pointer',
    'dark:aria-invalid:ring-destructive/40',
    'dark:hover:bg-accent/50',
    'decoration-[0.5px]',
    'disabled:opacity-50',
    'disabled:pointer-events-none',
    'focus-visible:border-ring',
    'focus-visible:ring-[3px]',
    'focus-visible:ring-ring/50',
    'font-medium',
    'gap-2',
    'h-auto',
    'has-[>svg]:px-3',
    'hover:bg-accent',
    'hover:text-muted-foreground',
    'items-center',
    'justify-center',
    'mb-1',
    'outline-none',
    'p-0',
    'pl-0.5',
    'pl-[26px]',
    'pl-[50px]',
    'px-0.5',
    'py-1.5',
    'rounded-none',
    'shrink-0',
    'text-left',
    'text-muted-foreground',
    'text-sm',
    'transition-all',
    'truncate',
    'underline',
    'underline-offset-4',
    'w-full',
    'whitespace-nowrap',
  ],
};

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

  expect(await violations(page)).toEqual(PENDING);
});

test('inline marks only use contract classnames', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: [...INLINE_MARKS, ...EDITORIAL_MARKS],
  });
  await openInView(page, pageId);

  expect(await violations(page)).toEqual({ editor: PENDING.editor });

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
