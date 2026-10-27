import {
  createContent,
  setWorkflowSeven,
} from '../../../../packages/tooling/playwright/content';
import {
  expect,
  test,
} from '../../../../packages/tooling/playwright/multilingual';

test.describe('Anonymous 401 redirect', () => {
  test('a private page sends an anonymous visitor to its language root', async ({
    page,
    request,
  }) => {
    // New content is private until published.
    await createContent(request, {
      contentType: 'Document',
      contentId: 'internal',
      contentTitle: 'Internal page',
      path: 'en',
    });

    await page.goto('/en/internal');
    await expect(page).toHaveURL(/\/en$/);
  });

  test('a private language root sends an anonymous visitor to the login page', async ({
    page,
    request,
  }) => {
    await setWorkflowSeven(request, { path: 'en', review_state: 'retract' });

    await page.goto('/en');
    await expect(page).toHaveURL(/\/login\?return_url=\/en$/);
    await expect(page.getByLabel('username')).toBeVisible();
  });

  test('the site root does not loop when the default language root is private', async ({
    page,
    request,
  }) => {
    await setWorkflowSeven(request, { path: 'en', review_state: 'retract' });

    // / → /en (the multilingual root redirect) → /login?return_url=/en,
    // never back to /.
    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/login\?return_url=\/en$/);
  });

  test('a signed-in editor is not redirected from a page they can see', async ({
    page,
    request,
  }) => {
    await createContent(request, {
      contentType: 'Document',
      contentId: 'internal',
      contentTitle: 'Internal page',
      path: 'en',
    });

    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.getByLabel('username').fill('admin');
    await page.getByLabel('password').fill('secret');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/en$/);

    await page.goto('/en/internal');
    await expect(page).toHaveURL(/\/en\/internal$/);
    await expect(
      page.getByRole('heading', { name: 'Internal page' }),
    ).toBeVisible();
  });
});
