import { expect, test } from '../../../../packages/tooling/playwright/test';
import { createContent } from '../../../../packages/tooling/playwright/content';
import { acceptanceApiURL } from '../../../../packages/tooling/playwright/backend';
import { login } from '../../../../packages/tooling/playwright/login';

test.describe.serial('Backend fixture isolation', () => {
  test('creates content in one test', async ({ page }) => {
    await createContent(page, {
      contentType: 'Document',
      contentId: 'fixture-isolation-probe',
      contentTitle: 'Fixture isolation probe',
    });
  });

  test('starts the next test without the previous content', async ({
    page,
  }) => {
    const { token } = await login(page);
    const response = await page.request.get(
      `${acceptanceApiURL()}/fixture-isolation-probe`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(response.status()).toBe(404);
  });
});
