import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

test.describe('Contents view', () => {
  test.beforeEach(async ({ page }) => {
    await createContent(page, {
      contentType: 'Document',
      contentId: 'root-document',
      contentTitle: 'Root Document',
    });
    await createContent(page, {
      contentType: 'Document',
      contentId: 'inside-news',
      contentTitle: 'Inside News',
      path: '/news',
    });
  });

  test('redirects anonymous users to login', async ({ page }) => {
    await page.goto('/@@contents', { waitUntil: 'networkidle' });

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('lists existing content for authenticated users', async ({ page }) => {
    await login(page);
    await page.goto('/@@contents', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: /Welcome to Plone/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /^Home$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /News/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Root Document/i }),
    ).toBeVisible();
  });

  test('navigates into a folder from the contents listing', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/@@contents', { waitUntil: 'networkidle' });

    await page.getByRole('link', { name: /^News$/i }).click();

    await expect(page).toHaveURL(/\/@@contents\/news$/);
    await expect(page.getByRole('heading', { name: 'News' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Inside News/i }),
    ).toBeVisible();
  });

  test('navigates to the content view for non-folder items', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/@@contents', { waitUntil: 'networkidle' });

    await page.getByRole('link', { name: /Root Document/i }).click();

    await expect(page).toHaveURL(/\/root-document$/);
    await expect(
      page.getByRole('heading', { name: 'Root Document' }),
    ).toBeVisible();
  });

  test('shows the edit, back, add and more buttons in the toolbar', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/@@contents/news', { waitUntil: 'networkidle' });

    const toolbar = page.getByRole('navigation', { name: 'Toolbar' });
    await expect(toolbar.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/@@edit/news',
    );
    await expect(toolbar.getByRole('link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/news',
    );
    await expect(
      toolbar.getByRole('button', { name: 'Add content' }),
    ).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'More' })).toBeVisible();
  });

  test('refuses users who cannot list the contents', async ({ page }) => {
    const api = process.env.API_PATH || 'http://127.0.0.1:55001/plone';
    const admin = await page.request.post(`${api}/@login`, {
      data: { login: 'admin', password: 'secret' },
      headers: { Accept: 'application/json' },
    });
    expect(admin.ok()).toBeTruthy();
    const { token } = await admin.json();
    const username = `contentsmember${Date.now()}`;
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const created = await page.request.post(`${api}/@users`, {
      headers,
      data: {
        username,
        email: `${username}@example.com`,
        password: 'password',
      },
    });
    expect(created.ok()).toBeTruthy();
    try {
      await login(page, { username, password: 'password' });
      const response = await page.goto('/@@contents/news');

      expect(response?.status()).toBe(401);
      await expect(page.getByRole('grid')).toHaveCount(0);
    } finally {
      await page.request.delete(`${api}/@users/${username}`, { headers });
    }
  });
});
