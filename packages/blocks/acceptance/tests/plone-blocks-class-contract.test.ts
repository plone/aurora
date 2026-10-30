import { expect, test } from '../../../tooling/playwright/test';
import { contractViolations } from '../../../tooling/playwright/contract';
import { createPloneBlocksPage, routeEmbeds } from '../fixtures/plone-blocks';

// Block content classname contract (plone/aurora#200): the Plone blocks in the
// public view only use contract classnames, `block-<type>__<part>` for their
// parts. The contract itself is in `tooling/playwright/contract.ts`.

test('the Plone blocks only use contract classnames', async ({ page }) => {
  await routeEmbeds(page);
  const pageId = await createPloneBlocksPage(page);
  await page.goto(`/${pageId}`);
  await expect(page.locator('[data-slate-editor] iframe')).toHaveCount(2);

  expect(await contractViolations(page)).toEqual({});
});

test('the Plone blocks render their contract hooks', async ({ page }) => {
  await routeEmbeds(page);
  const pageId = await createPloneBlocksPage(page);
  await page.goto(`/${pageId}`);
  const content = page.locator('[data-slate-editor]');

  await expect(
    content.locator('.block-image .block-image__frame img'),
  ).toHaveCount(1);
  await expect(
    content.locator(
      '.block-video .block-video__wrapper[data-align="center"] .block-video__figure .block-video__inner iframe',
    ),
  ).toHaveCount(1);
  await expect(
    content.locator(
      '.block-teaser .block-teaser__item :is(.block-teaser__image img, .block-teaser__title, .block-teaser__description)',
    ),
  ).toHaveCount(3);
  await expect(content.locator('.block-listing__headline')).toHaveText(
    'Listing',
  );
  await expect(
    content.locator('.block-listing__item:not([data-variation])'),
  ).toHaveCount(2);
  await expect(
    content.locator(
      '.block-listing__item[data-variation="summary"] .block-listing__body .block-listing__title',
    ),
  ).toHaveCount(1);
  await expect(
    content.locator('.block-maps .block-maps__frame iframe.block-maps__iframe'),
  ).toHaveCount(1);
});
