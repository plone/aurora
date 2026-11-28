import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import { waitForPlateEditorReady } from '../../../tooling/playwright/plate';
import {
  getEditorHandle,
  clickAtPath,
  setSelection,
} from '@platejs/playwright';

test('GET / shows Homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Home')).toBeVisible();
});

// Skipping this test until we have in place the runtime migration
test('GET /mypage shows a document', async ({ page }) => {
  await createContent(page, {
    contentType: 'Document',
    contentId: 'mypage',
    contentTitle: 'My page',
    transition: 'publish',
  });
  await page.goto('/mypage');
  await expect(page.locator('h1', { hasText: 'My page' })).toBeVisible();
});

test('As an editor, I can edit /mypage and interact with the editor', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'mypage',
    contentTitle: 'My page',
    transition: 'publish',
  });
  await page.goto('/@@edit/mypage');
  await expect(page.locator('h1', { hasText: 'My page' })).toBeVisible();
  await waitForPlateEditorReady(page);
  const editorHandle = await getEditorHandle(page);
  await clickAtPath(page, editorHandle, [1]);
  await page.keyboard.type('Hello world!');
});

test('As an editor, I can edit /mypage and interact with the editor - Selects a text and the floating toolbar shows up', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'mypage',
    contentTitle: 'My page',
    transition: 'publish',
  });
  await page.goto('/@@edit/mypage');
  await expect(page.locator('h1', { hasText: 'My page' })).toBeVisible();
  await waitForPlateEditorReady(page);
  const editorHandle = await getEditorHandle(page);
  await clickAtPath(page, editorHandle, [1]);
  await page.keyboard.type('Hello world!');
  await setSelection(page, editorHandle, {
    anchor: { path: [1, 0], offset: 0 },
    focus: { path: [1, 0], offset: 5 },
  });
  await expect(page.getByLabel('Editor toolbar')).toBeVisible();
});

test('refuses @@edit to users who cannot edit the item', async ({ page }) => {
  await createContent(page, {
    contentType: 'Document',
    contentId: 'not-editable',
    contentTitle: 'Not editable',
    transition: 'publish',
  });
  const api = process.env.API_PATH || 'http://127.0.0.1:55001/plone';
  const admin = await page.request.post(`${api}/@login`, {
    data: { login: 'admin', password: 'secret' },
    headers: { Accept: 'application/json' },
  });
  expect(admin.ok()).toBeTruthy();
  const { token } = await admin.json();
  const username = `editmember${Date.now()}`;
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
    const response = await page.goto('/@@edit/not-editable');

    expect(response?.status()).toBe(401);
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
  } finally {
    await page.request.delete(`${api}/@users/${username}`, { headers });
  }
});
