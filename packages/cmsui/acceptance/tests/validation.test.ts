import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

const isSave = (method: string) => (request: { method(): string }) =>
  request.method() === method;

test('A required field left empty is shown as invalid, and the content is not saved', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'needs-title',
    contentTitle: 'Needs a title',
  });
  const patches: string[] = [];
  page.on('request', (request) => {
    if (isSave('PATCH')(request)) patches.push(request.url());
  });

  await page.goto('/@@edit/needs-title', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();
  const title = page.getByRole('textbox', { name: 'Title' });
  await title.fill('');
  // Leave the Content tab: the save brings the editor back to the error.
  await page.getByRole('tab', { name: 'Blocks' }).click();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('tab', { name: 'Content' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('Required input is missing.')).toBeVisible();
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  expect(patches).toEqual([]);

  // Fixing the value clears the error and saves.
  await title.fill('Has a title');
  await expect(page.getByText('Required input is missing.')).toBeHidden();
  const saved = page.waitForResponse(
    (response) => isSave('PATCH')(response.request()) && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;
});

test('A required control panel field left empty is shown as invalid', async ({
  page,
}) => {
  await login(page);
  const posts: string[] = [];
  page.on('request', (request) => {
    if (isSave('POST')(request) && request.url().includes('/controlpanel/'))
      posts.push(request.url());
  });

  await page.goto('/controlpanel/site', { waitUntil: 'networkidle' });
  const siteTitle = page.getByRole('textbox', { name: 'Site title' });
  await siteTitle.fill('');
  await page.getByLabel('Save').click();

  await expect(page.getByText('Required input is missing.')).toBeVisible();
  await expect(siteTitle).toBeFocused();
  expect(posts).toEqual([]);
});
