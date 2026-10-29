import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

test.setTimeout(45_000);

test('personal tools edit the profile, save preferences and log out', async ({
  page,
}) => {
  const api = process.env.API_PATH || 'http://127.0.0.1:55001/plone';
  const admin = await page.request.post(`${api}/@login`, {
    data: { login: 'admin', password: 'secret' },
    headers: { Accept: 'application/json' },
  });
  expect(admin.ok()).toBeTruthy();
  const { token } = await admin.json();
  const username = `personaltools${Date.now()}`;
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
      roles: ['Manager'],
    },
  });
  expect(created.ok()).toBeTruthy();
  try {
    await login(page, { username, password: 'password' });
    await page.goto('/', { waitUntil: 'networkidle' });
    const toolbar = page.getByRole('navigation', { name: 'Toolbar' });
    await toolbar.getByRole('button', { name: 'Personal tools' }).click();
    await expect(
      page.getByRole('menuitem', { name: 'Site setup' }),
    ).toBeVisible();
    await page.getByRole('menuitem', { name: 'Profile' }).click();
    await expect(
      page.getByRole('heading', { name: 'Personal information' }),
    ).toBeVisible();
    await page.getByLabel('Full Name').fill('Toolbar Test User');
    await page.locator('input[type=file]').setInputFiles({
      name: 'portrait.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from(
        'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
        'base64',
      ),
    });
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('status')).toHaveText('Changes saved');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByLabel('Full Name')).toHaveValue('Toolbar Test User');
    await toolbar.getByRole('button', { name: 'Personal tools' }).click();
    const portrait = page.locator('.personal-tools-portrait');
    await expect(portrait).toBeVisible();
    await expect
      .poll(() =>
        portrait.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await expect(
      page.getByRole('heading', { name: 'Personal preferences' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/saved=1/);
    expect(
      (await page.context().cookies()).some(
        (cookie) => cookie.name === 'aurora_language',
      ),
    ).toBe(true);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await toolbar.getByRole('button', { name: 'Personal tools' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page.getByRole('navigation', { name: 'Toolbar' })).toHaveCount(
      0,
    );
  } finally {
    await page.request.delete(`${api}/@users/${username}`, { headers });
  }
});

test('anonymous visitors cannot open personal information', async ({
  page,
}) => {
  await page.goto('/personal-information');
  await expect(page).toHaveURL(/\/login/);
});

test('personal tools are hidden while editing but available in control panels', async ({
  page,
}) => {
  await login(page);
  const toolbar = page.getByRole('navigation', { name: 'Toolbar' });
  const personalTools = toolbar.getByRole('button', { name: 'Personal tools' });

  await page.goto('/@@edit', { waitUntil: 'networkidle' });
  await expect(toolbar.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(personalTools).toHaveCount(0);

  await page.goto('/@@edit/news', { waitUntil: 'networkidle' });
  await expect(toolbar.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(personalTools).toHaveCount(0);

  await page.goto('/controlpanel', { waitUntil: 'networkidle' });
  await expect(personalTools).toBeVisible();
  await page.goto('/controlpanel/site', { waitUntil: 'networkidle' });
  await expect(personalTools).toBeVisible();
});
