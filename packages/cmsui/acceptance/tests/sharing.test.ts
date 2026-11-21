import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import {
  acceptanceApiURL,
  acceptanceAuthorization,
  acceptanceManagerRole,
} from '../../../tooling/playwright/backend';

test('As an anonymous visitor, I cannot open the sharing page', async ({
  page,
}) => {
  await createContent(page, {
    contentType: 'Document',
    contentId: 'mypage',
    contentTitle: 'My page',
    transition: 'publish',
  });

  await page.goto('/@@sharing/mypage');

  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('As an editor, I can disable permission inheritance', async ({ page }) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'mypage',
    contentTitle: 'My page',
    transition: 'publish',
  });

  // Wait for hydration, otherwise React resets the checkbox and Save stays disabled
  await page.goto('/@@sharing/mypage', { waitUntil: 'networkidle' });

  const inherit = page.getByRole('checkbox', {
    name: 'Inherit permissions from higher levels',
  });
  await expect(inherit).toBeChecked();
  await inherit.uncheck({ force: true });

  await page.getByLabel('Save').click();
  await expect(page).toHaveURL(/\/mypage$/);

  await page.goto('/@@sharing/mypage');
  await expect(
    page.getByRole('checkbox', {
      name: 'Inherit permissions from higher levels',
    }),
  ).not.toBeChecked();
});

test('As an editor, I can grant a role to a group', async ({ page }) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'mypage',
    contentTitle: 'My page',
    transition: 'publish',
  });

  // Wait for hydration, otherwise React resets the checkbox and Save stays disabled
  await page.goto('/@@sharing/mypage', { waitUntil: 'networkidle' });
  await expect(page.locator('h1', { hasText: 'My page' })).toBeVisible();

  await page.getByLabel('Search for users and groups').fill('Reviewers');
  await page.keyboard.press('Enter');

  const reviewersRow = page.getByRole('row', { name: /Reviewers/ });
  const canView = reviewersRow.getByRole('checkbox', { name: 'Can view' });
  await expect(canView).not.toBeChecked();
  await canView.check({ force: true });

  await page.getByLabel('Save').click();
  await expect(page).toHaveURL(/\/mypage$/);

  await page.goto('/@@sharing/mypage?search=Reviewers');
  await expect(
    page.getByRole('row', { name: /Reviewers/ }).getByRole('checkbox', {
      name: 'Can view',
    }),
  ).toBeChecked();
});

test('As an editor, I cannot change my own roles', async ({ page }) => {
  const apiURL = acceptanceApiURL();

  // Add a portal user via the REST API (no tooling helper for users yet)
  const userResponse = await page.request.post(`${apiURL}/@users`, {
    headers: {
      Accept: 'application/json',
      Authorization: await acceptanceAuthorization(
        page.request,
        apiURL,
        'admin',
        'secret',
      ),
    },
    data: {
      username: 'some_test_user',
      fullname: 'some_test_user',
      email: 'some_test_user@example.com',
      password: 'some_secret_password',
      roles: [acceptanceManagerRole()],
    },
  });
  expect(userResponse.ok()).toBeTruthy();

  await createContent(page, {
    contentType: 'Document',
    contentId: 'mypage',
    contentTitle: 'My page',
    transition: 'publish',
  });

  await login(page, {
    username: 'some_test_user',
    password: 'some_secret_password',
  });

  await page.goto('/@@sharing/mypage?search=some_test_user');

  const ownRow = page.getByRole('row', { name: /some_test_user/ });
  await expect(ownRow).toBeVisible();

  const ownCheckboxes = ownRow.getByRole('checkbox');
  const count = await ownCheckboxes.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(ownCheckboxes.nth(i)).toBeDisabled();
  }
});
