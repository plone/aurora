import type { Page } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';

export const ploneAuth = ['admin', 'secret'];

async function cookieExists(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => cookie.name === 'auth_seven');
}

test.describe('Login Route Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.getByText('Sign in')).toBeVisible();
  });

  test('As registered user I can login', async ({ page }) => {
    const [user, password] = ploneAuth;

    await expect(page.getByLabel('username')).toBeVisible({ timeout: 10_000 });
    await page.getByLabel('username').fill(user);
    await page.getByLabel('password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect.poll(() => cookieExists(page)).toBe(true);
  });

  test('As registered user I can login after a failed attempt', async ({
    page,
  }) => {
    const [user, password] = ploneAuth;

    await expect(page.getByLabel('username')).toBeVisible({ timeout: 10_000 });
    await page.getByLabel('username').fill(user);
    await page.getByLabel('password').fill('wrong-password');
    const formBox = await page.locator('form').boundingBox();
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Wrong login and/or password.',
    );
    expect(await cookieExists(page)).toBe(false);
    // Showing the error must not move the form.
    expect(await page.locator('form').boundingBox()).toEqual(formBox);

    await page.getByLabel('password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect.poll(() => cookieExists(page)).toBe(true);
  });

  test('As a registered user I can logout', async ({ page }) => {
    const [user, password] = ploneAuth;

    await expect(page.getByLabel('username')).toBeVisible({ timeout: 10_000 });
    await page.getByLabel('username').fill(user);
    await page.getByLabel('password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect.poll(() => cookieExists(page)).toBe(true);

    await page.goto('/logout');
    await expect.poll(() => cookieExists(page)).toBe(false);
  });
});

test.describe('Login Route Tests without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('As registered user I can login after a failed attempt', async ({
    page,
  }) => {
    const [user, password] = ploneAuth;

    await page.goto('/login');
    await page.getByLabel('username').fill(user);
    await page.getByLabel('password').fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Wrong login and/or password.',
    );
    expect(await cookieExists(page)).toBe(false);

    await page.getByLabel('username').fill(user);
    await page.getByLabel('password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect.poll(() => cookieExists(page)).toBe(true);
  });
});
