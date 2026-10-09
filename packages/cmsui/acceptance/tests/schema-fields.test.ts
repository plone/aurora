import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

test('The edit form shows the related items a page already has', async ({
  page,
  request,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'related-target',
    contentTitle: 'Related target',
  });
  const target = await (
    await request.get('http://localhost:55001/plone/related-target', {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
      },
    })
  ).json();
  await createContent(page, {
    contentType: 'Document',
    contentId: 'related-source',
    contentTitle: 'Related source',
    bodyModifier: (body) => ({ ...body, relatedItems: [target.UID] }),
  });

  await page.goto('/@@edit/related-source', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();
  await page.locator('button', { hasText: /^Categorization$/ }).click();

  // The object browser starts from the field's value.
  await expect(page.getByRole('row', { name: 'Related target' })).toBeVisible();
});
