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
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 375, height: 812 });
    await toolbar.getByRole('button', { name: 'Personal tools' }).click();
    await expect(page.locator('.toolbar-mobile-sheet')).not.toHaveAttribute(
      'data-entering',
    );
    const mobileSheet = page.getByRole('dialog', { name: 'Personal tools' });
    await expect(mobileSheet.locator('.personal-tools-portrait')).toBeVisible();
    await expect
      .poll(() =>
        mobileSheet
          .locator('.personal-tools-portrait')
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await expect(mobileSheet).not.toBeVisible();
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
    await expect(page.locator('.toolbar-mobile-sheet')).not.toHaveAttribute(
      'data-entering',
    );
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

test('personal tools use a dismissible mobile sheet and a desktop popover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await page.goto('/controlpanel', { waitUntil: 'networkidle' });
  const button = page
    .getByRole('navigation', { name: 'Toolbar' })
    .getByRole('button', { name: 'Personal tools' });
  await button.click();
  const sheet = page.getByRole('dialog', { name: 'Personal tools' });
  await expect(sheet).toBeVisible();
  await expect(page.locator('.toolbar-mobile-sheet')).not.toHaveAttribute(
    'data-entering',
  );
  await expect(
    sheet.getByRole('menuitem', { name: 'Profile' }),
  ).toHaveAttribute('href', '/personal-information');
  await expect(
    sheet.getByRole('menuitem', { name: 'Preferences' }),
  ).toBeVisible();
  await expect(
    sheet.getByRole('menuitem', { name: 'Site setup' }),
  ).toBeVisible();
  await expect(sheet.getByRole('menuitem', { name: 'Log out' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Close Personal tools' }).click();
  await expect(sheet).not.toBeVisible();
  await expect(button).toBeFocused();
  await button.click();
  await expect(sheet).toBeVisible();
  await expect(page.locator('.toolbar-mobile-sheet')).not.toHaveAttribute(
    'data-entering',
  );
  await page.keyboard.press('Escape');
  await expect(sheet).not.toBeVisible();
  await page.setViewportSize({ width: 1024, height: 768 });
  await button.click();
  await expect(
    page.getByRole('menu', { name: 'Personal tools' }),
  ).toBeVisible();
  await expect(page.locator('.toolbar-mobile-sheet')).toHaveCount(0);
});
