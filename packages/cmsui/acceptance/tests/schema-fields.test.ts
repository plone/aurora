import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import {
  acceptanceApiURL,
  acceptanceAuthorization,
} from '../../../tooling/playwright/backend';

const API = acceptanceApiURL();

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
    await request.get(`${API}/related-target`, {
      headers: {
        Accept: 'application/json',
        Authorization: await acceptanceAuthorization(
          request,
          API,
          'admin',
          'secret',
        ),
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

test('Saving the edit form stores the changed metadata', async ({
  page,
  request,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'metadata-save',
    contentTitle: 'Metadata save',
  });

  await page.goto('/@@edit/metadata-save', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();
  await page.getByLabel('Summary').fill('A summary typed in the form');

  const saved = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;

  const content = await (
    await request.get(`${API}/metadata-save`, {
      headers: {
        Accept: 'application/json',
        Authorization: await acceptanceAuthorization(
          request,
          API,
          'admin',
          'secret',
        ),
      },
    })
  ).json();
  expect(content.description).toBe('A summary typed in the form');
  expect(content.title).toBe('Metadata save');
});
