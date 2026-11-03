import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { selectPlateEditorText } from '../../../tooling/playwright/plate';
import { getEditorHandle } from '@platejs/playwright';

import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';
import { nativeBlockSections } from '../fixtures/native-blocks';
import { getBlock } from '../fixtures/editor';

// Code blocks only have one width, the default one, whatever the stored value
// is. The rendered box must span that width, not shrink to fit its code.

const codeBlock = (blockWidth?: string) => ({
  ...nativeBlockSections.codeBlock[0],
  ...(blockWidth ? { blockWidth } : {}),
});

async function expectDefaultWidth(page: Page) {
  const box = page.locator('.slate-code_block pre').first().locator('..');
  await expect(box).toBeVisible();

  const widths = await box.evaluate((element) => {
    const container = element.closest('.block-inner-container')!;
    const probe = document.createElement('div');
    probe.style.width = 'var(--default-container-width)';
    document.body.append(probe);
    const defaultWidth = probe.getBoundingClientRect().width;
    probe.remove();

    return {
      box: element.getBoundingClientRect().width,
      container: container.getBoundingClientRect().width,
      maxWidth: parseFloat(getComputedStyle(container).maxWidth),
      defaultWidth,
    };
  });

  expect(widths.box).toBe(widths.container);
  expect(widths.maxWidth).toBe(widths.defaultWidth);
}

for (const storedWidth of [undefined, 'narrow', 'layout', 'full']) {
  const label = storedWidth ? `a stored "${storedWidth}"` : 'no stored';

  test(`Code block with ${label} width is edited at the default width`, async ({
    page,
  }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, [], {
      extra: [codeBlock(storedWidth)],
    });
    await openInEditor(page, pageId);
    const editorHandle = await getEditorHandle(page);

    await expect
      .poll(async () => (await getBlock(page, editorHandle, 1))?.blockWidth)
      .toBe('default');
    await expectDefaultWidth(page);
  });

  test(`Code block with ${label} width is rendered at the default width`, async ({
    page,
  }) => {
    await login(page);
    const pageId = await createNativeBlocksPage(page, [], {
      extra: [codeBlock(storedWidth)],
    });
    await openInView(page, pageId);

    await expectDefaultWidth(page);
  });
}

test('Code block does not offer a block width choice', async ({ page }) => {
  await login(page);
  const pageId = await createNativeBlocksPage(page, ['codeBlock']);
  await openInEditor(page, pageId);
  const editorHandle = await getEditorHandle(page);

  await selectPlateEditorText(
    page,
    editorHandle,
    {
      anchor: { path: [1, 0, 0], offset: 0 },
      focus: { path: [1, 0, 0], offset: 8 },
    },
    'function',
  );

  await expect(page.getByLabel('Block width')).toHaveCount(0);
});
