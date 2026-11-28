import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';

// The public UI and the CMS UI render different documents. A client-side
// navigation from one to the other mounts the new document on the client.

const PAGE_ID = 'long-page';

test.describe('Switching between the public UI and the CMS UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await createContent(page, {
      contentType: 'Document',
      contentId: PAGE_ID,
      contentTitle: 'Long page',
      transition: 'publish',
      bodyModifier: (body) => ({
        ...body,
        blocks: {
          main: {
            '@type': 'plate',
            value: [
              { type: 'title', children: [{ text: 'Long page' }] },
              ...Array.from({ length: 60 }, (_, index) => ({
                type: 'p',
                children: [{ text: `Paragraph ${index + 1}` }],
              })),
            ],
          },
        },
      }),
    });
  });

  test('renders no script tag on the client', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message) => messages.push(message.text()));

    await page.goto(`/${PAGE_ID}`);
    await page.getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(`/@@edit/${PAGE_ID}`);
    await waitForPlateEditorReady(page);

    await page.goBack();
    await expect(page).toHaveURL(`/${PAGE_ID}`);
    await expect(page.getByText('Paragraph 60')).toBeVisible();

    expect(
      messages.filter((text) => text.includes('Encountered a script tag')),
    ).toEqual([]);
  });

  test('restores the scroll position after going back', async ({ page }) => {
    await page.goto(`/${PAGE_ID}`);
    await page.getByText('Paragraph 60').scrollIntoViewIfNeeded();
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    await page.getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(`/@@edit/${PAGE_ID}`);
    await waitForPlateEditorReady(page);

    await page.goBack();
    await expect(page).toHaveURL(`/${PAGE_ID}`);
    // Restored, not reset to the top. The documents' layouts may shift it by
    // a few pixels.
    await expect
      .poll(() => page.evaluate((y) => Math.abs(window.scrollY - y), scrollY))
      .toBeLessThan(100);
  });
});
