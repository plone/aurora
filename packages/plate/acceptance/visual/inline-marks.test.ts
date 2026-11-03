import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';
import { INLINE_MARKS } from '../fixtures/inline-marks';
import { settle } from './helpers';

// The inline marks and elements the native blocks fixture doesn't use:
// keyboard input, highlight and mentions, next to inline code and a link.

test('Inline marks in the public view', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: INLINE_MARKS,
  });

  await openInView(page, pageId);
  await settle(page);

  await expect(page.locator('[data-slate-editor]')).toHaveScreenshot(
    'inline-marks-view.png',
  );
});

test('Inline marks in the editor', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, [], {
    extra: INLINE_MARKS,
  });

  await openInEditor(page, pageId);
  await page.mouse.move(0, 0);
  await settle(page);

  await expect(page.locator('[data-slate-editor]')).toHaveScreenshot(
    'inline-marks-edit.png',
  );
});
