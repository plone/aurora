import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';
import {
  selectPlateEditorText,
  waitForPlateEditorReady,
} from '../../../tooling/playwright/plate';
import { clickAtPath, getEditorHandle } from '@platejs/playwright';

const FOLDER_TITLE = 'Object browser folder';
const CHILD_TITLE = 'Object browser child';
const PAGE_TITLE = 'Object browser page';

test('The object browser lists a folder and its breadcrumbs', async ({
  page,
}) => {
  await login(page);
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const folderId = `object-browser-folder-${suffix}`;
  const pageId = `object-browser-page-${suffix}`;

  // Documents are folderish with plone.volto.
  await createContent(page, {
    contentType: 'Document',
    contentId: folderId,
    contentTitle: FOLDER_TITLE,
  });
  await createContent(page, {
    contentType: 'Document',
    contentId: 'child',
    contentTitle: CHILD_TITLE,
    path: folderId,
  });
  await createContent(page, {
    contentType: 'Document',
    contentId: pageId,
    contentTitle: PAGE_TITLE,
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: PAGE_TITLE }] },
            { type: 'p', children: [{ text: 'Hello world!' }] },
          ],
        },
      },
      blocks_layout: { items: ['__somersault__'] },
    }),
  });

  await page.goto(`/@@edit/${pageId}`);
  await waitForPlateEditorReady(page);

  const editorHandle = await getEditorHandle(page);
  await clickAtPath(page, editorHandle, [1]);
  await selectPlateEditorText(
    page,
    editorHandle,
    {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 5 },
    },
    'Hello',
  );
  await page
    .getByLabel('Editor toolbar')
    .locator('button:has(.lucide-link)')
    .click();
  await page.getByRole('button', { name: 'Browse content' }).click();

  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: `Navigate to ${FOLDER_TITLE}` })
    .click();

  await expect(dialog.getByText(CHILD_TITLE, { exact: true })).toBeVisible();
  await expect(dialog.getByText(FOLDER_TITLE, { exact: true })).toBeVisible();
});

test('The object browser gives an empty listing for a folder that does not exist', async ({
  page,
}) => {
  await login(page);

  // On the add form, the image field browses a path that doesn't exist
  // (`/@@add`). The object browser gives an empty listing for it, instead of
  // an error replacing the form.
  await page.goto('/@@add?type=Image', { waitUntil: 'networkidle' });
  const listing = page.waitForResponse((response) =>
    response.url().includes('/@objectBrowserWidget/'),
  );
  await page.getByRole('tab', { name: 'Content' }).click();
  expect((await listing).status()).toBe(200);

  await expect(
    page.getByText('Browse the site, drop an image, or use a URL'),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Content' })).toBeVisible();
});
