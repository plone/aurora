import {
  expect,
  test,
} from '../../../../packages/tooling/playwright/multilingual';

test.describe('Multilingual root redirect', () => {
  test('a full load of the site root lands on the default language root', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
  });

  test('a client-side navigation to the site root lands on the default language root', async ({
    page,
  }) => {
    // The login action redirects to the site root once signed in. That is a
    // client-side navigation, which fetches /_.data, not /.
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.getByLabel('username').fill('admin');
    await page.getByLabel('password').fill('secret');

    const rootData = page.waitForRequest((request) =>
      /^\/_[^/]*\.data$/.test(new URL(request.url()).pathname),
    );
    await page.getByRole('button', { name: /sign in/i }).click();
    await rootData;

    await expect(page).toHaveURL(/\/en$/);
  });

  test('a language root is not redirected', async ({ page }) => {
    await page.goto('/de');
    await expect(page).toHaveURL(/\/de$/);
  });
});

test.describe('Multilingual root redirect with another default language', () => {
  test.use({ languages: ['de', 'en'] });

  test('the site root lands on the default language root', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/de$/);
  });
});
