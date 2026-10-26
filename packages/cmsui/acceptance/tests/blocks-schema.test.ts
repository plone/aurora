import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

test('The @blocks-schema endpoint needs authentication', async ({ page }) => {
  const response = await page.request.get('/@blocks-schema');

  expect(response.status()).toBe(401);
  expect(response.headers()['www-authenticate']).toBe('Bearer');
});

test('The @blocks-schema endpoint lists the blocks with their docs', async ({
  page,
}) => {
  await login(page);

  const response = await page.request.get('/@blocks-schema');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json();
  expect(body.document).toContain('__somersault__');
  expect(body.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'teaser',
        title: 'Teaser',
        description: expect.stringContaining('links to one content item'),
      }),
    ]),
  );
});

test('The @blocks-schema endpoint describes one block', async ({ page }) => {
  await login(page);

  const response = await page.request.get('/@blocks-schema/image');
  const body = await response.json();

  expect(body.id).toBe('image');
  expect(body.docs).toContain('### Example');
  expect(body.schema.properties.url).toEqual(
    expect.objectContaining({ title: 'Image URL', widget: 'image' }),
  );
  // The alt text description is a React element, so it's left out.
  expect(body.schema.properties.alt).toEqual({ title: 'Alt text' });

  const missing = await page.request.get('/@blocks-schema/nope');
  expect(missing.status()).toBe(404);
});

test('The @blocks-schema endpoint answers in Markdown', async ({ page }) => {
  await login(page);

  const response = await page.request.get('/@blocks-schema?format=md');

  expect(response.headers()['content-type']).toContain('text/markdown');
  const markdown = await response.text();
  expect(markdown).toMatch(/^# Blocks\n/);
  expect(markdown).toContain('## Document format');
  expect(markdown).toContain('## Teaser (`teaser`)');
});

test('The @blocks-schema endpoint accepts a Bearer token', async ({ page }) => {
  const { token } = await login(page);
  await page.context().clearCookies();

  const response = await page.request.get('/@blocks-schema', {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);
});

test('The @blocks-schema endpoint lists the blocks offered for a content item', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'blocks-schema-page',
    contentTitle: 'Blocks schema page',
  });

  const response = await page.request.get('/blocks-schema-page/@blocks-schema');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe(
    'private, max-age=0, must-revalidate',
  );
  const body = await response.json();
  expect(body.items.map((item: { id: string }) => item.id)).toContain('teaser');

  const block = await page.request.get(
    '/blocks-schema-page/@blocks-schema/teaser',
  );
  expect((await block.json()).id).toBe('teaser');

  const missing = await page.request.get('/does-not-exist/@blocks-schema');
  expect(missing.status()).toBe(404);
});
