import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { contractViolations as violations } from '../../../tooling/playwright/contract';
import { EDITORIAL_MARKS, INLINE_MARKS } from '../fixtures/inline-marks';
import { ALL_NATIVE_BLOCK_SECTIONS } from '../fixtures/native-blocks';
import { createNativeBlocksPage, openInView } from '../fixtures/pages';

// Block content classname contract (plone/aurora#200): the native blocks in
// the public view only use contract classnames. The contract itself is in
// `tooling/playwright/contract.ts`.

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
