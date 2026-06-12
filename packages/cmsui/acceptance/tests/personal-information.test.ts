import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

// The standard plone.app.testing member, not the Zope root admin
// Its member fields start out empty, so we seed them below.
const TEST_USER = {
  userId: 'test_user_1_',
  username: 'test-user',
  password: 'correct horse battery staple',
  email: 'jane@example.com',
  fullname: 'Jane Doe',
  location: 'Bonn',
};

function getApiURL() {
  const hostname = process.env.BACKEND_HOST || '127.0.0.1';
  const siteId = process.env.SITE_ID || 'plone';
  return process.env.API_PATH || `http://${hostname}:55001/${siteId}`;
}

function basicAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;
}

async function seedTestUser(page: Page) {
  const url = `${getApiURL()}/@users/${TEST_USER.userId}`;
  const response = await page.request.patch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader('admin', 'secret'),
    },
    data: {
      email: TEST_USER.email,
      fullname: TEST_USER.fullname,
      location: TEST_USER.location,
    },
  });
  if (!response.ok()) {
    throw new Error(
      `User seeding failed: PATCH ${url} returned ${response.status()} ${response.statusText()}`,
    );
  }
}

async function getTestUserData(page: Page) {
  const url = `${getApiURL()}/@users/${TEST_USER.userId}`;
  const response = await page.request.get(url, {
    headers: {
      Accept: 'application/json',
      Authorization: basicAuthHeader(TEST_USER.username, TEST_USER.password),
    },
  });
  if (!response.ok()) {
    throw new Error(
      `User fetch failed: GET ${url} returned ${response.status()} ${response.statusText()}`,
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

test.describe('Personal Information Route Tests', () => {
  test('As an anonymous visitor I am redirected to login', async ({ page }) => {
    await page.goto('/@@personal-information');
    await page.waitForURL('**/login');
    await expect(page.getByText('Sign in')).toBeVisible({ timeout: 10_000 });
  });

  test.describe('As a logged-in user', () => {
    test.beforeEach(async ({ page }) => {
      await seedTestUser(page);
      await login(page, {
        username: TEST_USER.username,
        password: TEST_USER.password,
      });
      await page.goto('/@@personal-information', {
        waitUntil: 'networkidle',
      });
      await expect(
        page.getByRole('heading', { name: 'Personal Information' }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test('I see the form seeded with my member data', async ({ page }) => {
      await expect(page.getByLabel('Full Name')).toHaveValue(
        TEST_USER.fullname,
      );
      await expect(page.getByLabel('Email')).toHaveValue(TEST_USER.email);
      await expect(page.getByLabel('Location')).toHaveValue(TEST_USER.location);
      await expect(page.getByLabel('Home page')).toHaveValue('');
      await expect(page.getByLabel('Biography')).toHaveValue('');
      await expect(page.getByLabel('Portrait')).toHaveValue('');
    });

    test('I can edit my data and save, and the changes persist', async ({
      page,
    }) => {
      await page.getByLabel('Full Name').fill('Janet Doe');
      await page.getByLabel('Location').fill('Berlin');
      await page.getByRole('button', { name: 'Save' }).click();

      // the sr-only live region announces the successful save
      await expect(page.getByRole('status')).toHaveText('Changes saved.');

      // The PATCH happens server-side in the route action, so verify
      // persistence directly against the backend.
      await expect
        .poll(async () => (await getTestUserData(page)).location, {
          timeout: 10_000,
        })
        .toBe('Berlin');
      expect((await getTestUserData(page)).fullname).toBe('Janet Doe');

      // A full reload re-runs the loader; the form must re-seed with the
      // saved values.
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page.getByLabel('Full Name')).toHaveValue('Janet Doe');
      await expect(page.getByLabel('Location')).toHaveValue('Berlin');
    });

    test('Pressing Enter in a field saves the form', async ({ page }) => {
      await page.getByLabel('Location').fill('Hamburg');
      await page.getByLabel('Location').press('Enter');

      await expect
        .poll(async () => (await getTestUserData(page)).location, {
          timeout: 10_000,
        })
        .toBe('Hamburg');
    });

    test('Cancel takes me back to the home page', async ({ page }) => {
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page).toHaveURL('/');
    });

    // Change-password link points to `reset-password` route from PR #109
    test('A change-password link points at the reset-password route', async ({
      page,
    }) => {
      const link = page.getByRole('link', { name: 'Change Password' });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', '/reset-password');
    });
  });
});
