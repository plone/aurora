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
  expect(body.document_model).toEqual({ id: 'plone.plate', version: 1 });
  expect(body.document).toContain('__somersault__');
  expect(body).not.toHaveProperty('document_models');
  expect(body.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        '@id': expect.stringMatching(
          /^https?:\/\/[^/]+\/@blocks-schema\/teaser$/,
        ),
        id: 'teaser',
        title: 'Teaser',
        kind: 'block',
        description: expect.stringContaining('links to one content item'),
      }),
      expect.objectContaining({ id: 'p', kind: 'element' }),
      expect.objectContaining({ id: 'h2', kind: 'element' }),
    ]),
  );

  // Each item links to its details.
  const teaser = body.items.find(
    (item: { id: string }) => item.id === 'teaser',
  );
  const detail = await (await page.request.get(teaser['@id'])).json();
  expect(detail).toMatchObject({ '@id': teaser['@id'], id: 'teaser' });
  expect(detail.docs).toContain('### Example');
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

  const table = await (await page.request.get('/@blocks-schema/table')).json();
  expect(table).toMatchObject({ id: 'table', kind: 'element' });
  expect(table.docs).toContain('"type": "tr"');

  const missing = await page.request.get('/@blocks-schema/nope');
  expect(missing.status()).toBe(404);
});

test('The @blocks-schema endpoint answers in Markdown', async ({ page }) => {
  await login(page);

  const response = await page.request.get('/@blocks-schema', {
    headers: { Accept: 'text/markdown' },
  });

  expect(response.headers()['content-type']).toContain('text/markdown');
  const markdown = await response.text();
  expect(markdown).toMatch(/^# Blocks\n/);
  expect(markdown).toContain(
    '## Document format\n\n_Document model `plone.plate`, version 1._',
  );
  expect(markdown).toMatch(
    /- \[Teaser\]\(https?:\/\/[^/]+\/@blocks-schema\/teaser\) \(`teaser`\): /,
  );

  const teaser = await page.request.get('/@blocks-schema/teaser', {
    headers: { Accept: 'text/markdown' },
  });
  expect(await teaser.text()).toContain('## Teaser (`teaser`)');
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
  expect(body['@id']).toMatch(/\/blocks-schema-page\/@blocks-schema$/);
  expect(body.items.map((item: { id: string }) => item.id)).toContain('teaser');

  const block = await page.request.get(
    '/blocks-schema-page/@blocks-schema/teaser',
  );
  expect((await block.json()).id).toBe('teaser');

  const missing = await page.request.get('/does-not-exist/@blocks-schema');
  expect(missing.status()).toBe(404);
});

test('The @blocks-schema endpoint keeps the content type in its links', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'blocks-schema-type',
    contentTitle: 'Blocks schema type',
  });

  const response = await page.request.get(
    '/blocks-schema-type/@blocks-schema?type=News%20Item',
  );
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body['@id']).toMatch(
    /\/blocks-schema-type\/@blocks-schema\?type=News%20Item$/,
  );
  expect(body.document_model).toEqual({ id: 'plone.plate', version: 1 });
  const teaser = body.items.find(
    (item: { id: string }) => item.id === 'teaser',
  );
  expect(teaser['@id']).toMatch(
    /\/blocks-schema-type\/@blocks-schema\/teaser\?type=News%20Item$/,
  );
  expect((await (await page.request.get(teaser['@id'])).json()).id).toBe(
    'teaser',
  );
});
