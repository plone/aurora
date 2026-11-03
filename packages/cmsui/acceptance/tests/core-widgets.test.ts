import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

const API = 'http://localhost:55001/plone';
const AUTH = `Basic ${Buffer.from('admin:secret').toString('base64')}`;

const getJSON = async (request: APIRequestContext, path: string) =>
  (
    await request.get(`${API}${path}`, {
      headers: { Accept: 'application/json', Authorization: AUTH },
    })
  ).json();

// A 1x1 PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

test('The tags of a page are added as tokens and saved as a list', async ({
  page,
  request,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'tagged-page',
    contentTitle: 'Tagged page',
  });

  await page.goto('/@@edit/tagged-page', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();
  await page.locator('button', { hasText: /^Categorization$/ }).click();

  const tags = page.getByRole('combobox', { name: 'Tags' });
  await tags.fill('aurora');
  await tags.press('Enter');
  await tags.fill('plone');
  await tags.press('Enter');
  await expect(page.getByRole('row', { name: 'aurora' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'plone' })).toBeVisible();

  const saved = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;

  const content = await getJSON(request, '/tagged-page');
  expect(content.subjects).toEqual(['aurora', 'plone']);
});

test('A field with a vocabulary or choices is a select', async ({
  page,
  request,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'select-page',
    contentTitle: 'Select page',
  });

  await page.goto('/@@edit/select-page', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();

  // The language's options come from its vocabulary.
  await page.locator('button', { hasText: /^Categorization$/ }).click();
  await page.getByRole('button', { name: /Language/ }).click();
  await page.getByRole('option', { name: 'English' }).click();

  // Allow discussion has its choices in the schema. The content API sends
  // its value as a boolean.
  await page.locator('button', { hasText: /^Settings$/ }).click();
  const allowDiscussion = page.getByRole('button', {
    name: /Allow discussion/,
  });
  await expect(allowDiscussion).toContainText('No');
  await allowDiscussion.click();
  await page.getByRole('option', { name: 'Yes' }).click();

  const saved = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;

  const content = await getJSON(request, '/select-page');
  expect(content.language.token).toBe('en');
  expect(content.allow_discussion).toBe(true);
});

test('A control panel shows the terms of its lists, and saves them', async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto('/controlpanel/navigation', { waitUntil: 'networkidle' });

  // The content API sends the terms of a vocabulary with their titles.
  await expect(page.getByRole('row', { name: 'Page' })).toBeVisible();

  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/controlpanel/navigation'),
  );
  await page.getByLabel('Save').click();
  await saved;

  const settings = await getJSON(request, '/@controlpanels/navigation');
  expect(
    settings.data.displayed_types.map((term: { token: string }) => term.token),
  ).toContain('Document');
});

test('A control panel saves its numbers as numbers, and hides passwords', async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto('/controlpanel/mail', { waitUntil: 'networkidle' });

  const port = page.getByRole('textbox', { name: 'SMTP port' });
  await expect(port).toHaveValue('25');
  await port.fill('2525');
  await port.blur();
  const password = page.getByLabel('ESMTP password');
  await expect(password).toHaveAttribute('type', 'password');
  await password.fill('s3cret');
  // Required by the mail settings.
  await page.getByLabel("Site 'From' name").fill('Aurora');
  await page.getByLabel("Site 'From' address").fill('aurora@example.com');

  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/controlpanel/mail'),
  );
  await page.getByLabel('Save').click();
  await saved;

  const settings = await getJSON(request, '/@controlpanels/mail');
  expect(settings.data.smtp_port).toBe(2525);
  expect(settings.data.smtp_pass).toBe('s3cret');

  // Leave the mail settings as they were.
  await request.patch(`${API}/@controlpanels/mail`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: AUTH,
    },
    data: {
      smtp_port: 25,
      smtp_pass: null,
      email_from_name: null,
      email_from_address: null,
    },
  });
});

test('Adding a file uploads the chosen file', async ({ page, request }) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'downloads',
    contentTitle: 'Downloads',
  });

  await page.goto('/@@add/downloads?type=File', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();
  await page.getByLabel('Title').fill('Report');
  await page.getByLabel('File', { exact: true }).setInputFiles({
    name: 'report.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('The annual report'),
  });
  await expect(page.getByText('report.txt')).toBeVisible();

  const created = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await created;

  const listing = await getJSON(request, '/downloads/@search?portal_type=File');
  expect(listing.items).toHaveLength(1);
  const file = await getJSON(
    request,
    new URL(listing.items[0]['@id']).pathname.replace(/^\/plone/, ''),
  );
  expect(file.file.filename).toBe('report.txt');
  expect(file.file.size).toBe('The annual report'.length);
});

test('Adding an image uploads the chosen image, and shows a preview', async ({
  page,
  request,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'gallery',
    contentTitle: 'Gallery',
  });

  // The add form used to crash here (#163), and then offered to pick an
  // image URL, which the image field of an Image can't store.
  await page.goto('/@@add/gallery?type=Image', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();
  await page.getByLabel('Title').fill('Pixel');
  await page.getByLabel('Image', { exact: true }).setInputFiles({
    name: 'pixel.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  await expect(page.locator('img[src^="data:image/png"]')).toBeVisible();

  const created = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await created;

  const listing = await getJSON(request, '/gallery/@search?portal_type=Image');
  expect(listing.items).toHaveLength(1);
  const image = await getJSON(
    request,
    new URL(listing.items[0]['@id']).pathname.replace(/^\/plone/, ''),
  );
  expect(image.image.filename).toBe('pixel.png');
  expect(image.image['content-type']).toBe('image/png');
});
