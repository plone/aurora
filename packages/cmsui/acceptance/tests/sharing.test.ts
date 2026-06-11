import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

test('As an editor, I can grant a role to a group', async ({ page }) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'mypage',
    contentTitle: 'My page',
    transition: 'publish',
  });

  await page.goto('/@@sharing/mypage');
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
