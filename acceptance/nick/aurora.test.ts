import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { login } from '../../packages/tooling/playwright/login';

const apiURL = (process.env.API_PATH ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
);

test('renders Nick content in Aurora and lists it in the contents view', async ({
  page,
  request,
}) => {
  const { token } = await login(page, {
    apiURL,
    username: 'admin',
    password: 'admin',
  });
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const id = `aurora-test-${randomUUID()}`;
  const title = `Aurora test ${id}`;
  let uid: string | undefined;

  try {
    const created = await request.post(apiURL, {
      headers,
      data: { '@type': 'Folder', id, title },
    });
    expect(created.status()).toBe(201);
    const content = await created.json();
    uid = content.UID;
    expect(uid).toBeTruthy();

    const child = await request.post(`${apiURL}/${id}`, {
      headers,
      data: { '@type': 'Page', id: 'test-page', title: 'Test page' },
    });
    expect(child.status()).toBe(201);

    await page.goto(`/${id}/test-page`);
    await expect(
      page.getByRole('heading', { name: 'Test page' }),
    ).toBeVisible();

    await page.goto(`/@@contents/${id}`);
    const item = page.getByRole('link', { name: /Test page/ });
    await expect(item).toBeVisible();
    await expect(item.locator('.expired, .future')).toHaveCount(0);
  } finally {
    if (uid) {
      const deleted = await request.delete(`${apiURL}/${id}`, { headers });
      expect(deleted.ok()).toBeTruthy();
      const purged = await request.delete(`${apiURL}/@recyclebin/${uid}`, {
        headers,
      });
      // Nick can be configured to delete immediately instead of using a bin.
      expect([204, 404]).toContain(purged.status());
    }
  }
});
