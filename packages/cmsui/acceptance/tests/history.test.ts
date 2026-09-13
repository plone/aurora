import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

const apiURL =
  process.env.API_PATH ||
  `http://${process.env.BACKEND_HOST || '127.0.0.1'}:55001/${process.env.SITE_ID || 'plone'}`;

const authHeader = `Basic ${Buffer.from('admin:secret', 'utf8').toString('base64')}`;

/**
 * Opens the history page and waits for hydration: the toolbar back button is
 * rendered client-side only (Pluggable), so once it is visible the react-aria
 * widgets are interactive.
 */
async function openHistory(page: Parameters<typeof login>[0]) {
  await page.goto('/@@history/my-page');
  await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
}

/** Edits the document via the API so a new version is recorded. */
async function editTitle(page: Parameters<typeof login>[0], title: string) {
  const response = await page.request.patch(`${apiURL}/my-page`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    data: { title },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe('History route', () => {
  test.beforeEach(async ({ page }) => {
    await createContent(page, {
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'My Page',
    });
    await login(page);
  });

  test('lists the revision history of a document', async ({ page }) => {
    await page.goto('/@@history/my-page');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Changes to "My Page"',
    );
    // the creation already yields at least one entry
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('redirects anonymous visitors to the login', async ({ page }) => {
    // a published page: on private content the middleware already fails the
    // anonymous content fetch (error boundary) before the loader's auth
    // guard can redirect
    await createContent(page, {
      contentType: 'Document',
      contentId: 'public-page',
      contentTitle: 'Public Page',
      transition: 'publish',
    });
    await page.context().clearCookies();

    await page.goto('/@@history/public-page');

    await expect(page).toHaveURL(/\/login/);
  });

  test('navigates back to the content via the toolbar back button', async ({
    page,
  }) => {
    await openHistory(page);

    await page.getByRole('link', { name: 'Back' }).click();

    await expect(page).toHaveURL(/\/my-page$/);
    await expect(
      page.getByRole('heading', { name: 'My Page', exact: true }),
    ).toBeVisible();
  });

  test('asks for confirmation before reverting', async ({ page }) => {
    // two edits, so an older, revertable version exists
    await editTitle(page, 'My Page (v2)');
    await editTitle(page, 'My Page (v3)');

    await openHistory(page);

    // the oldest versioning row is revertable; its menu is the last one
    await page.getByRole('button', { name: 'Actions' }).last().click();
    await page
      .getByRole('menuitem', { name: 'Revert to this version' })
      .click();

    // the menu popover is itself a (closing) dialog, so match by name
    const dialog = page.getByRole('dialog', {
      name: 'Revert to this version?',
    });
    await expect(dialog).toBeVisible();

    // cancelling closes the dialog without changing the content
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Changes to "My Page (v3)"',
    );
  });

  test('reverts to a previous version after confirmation', async ({ page }) => {
    await editTitle(page, 'My Page (v2)');
    await editTitle(page, 'My Page (v3)');

    await openHistory(page);

    await page.getByRole('button', { name: 'Actions' }).last().click();
    await page
      .getByRole('menuitem', { name: 'Revert to this version' })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Revert to this version?',
    });
    await dialog.getByRole('button', { name: 'Revert' }).click();

    // the dialog closes on success and the loader revalidates: the title
    // shows the restored (oldest) state again
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Changes to "My Page"',
    );
  });

  test('shows an older revision via "View this revision"', async ({ page }) => {
    await editTitle(page, 'My Page (v2)');
    await editTitle(page, 'My Page (v3)');

    await openHistory(page);

    // the last menu belongs to the oldest version (v0, title "My Page")
    await page.getByRole('button', { name: 'Actions' }).last().click();
    await page.getByRole('menuitem', { name: 'View this revision' }).click();

    await expect(page).toHaveURL(/\?version=0$/);
    await expect(
      page.getByRole('heading', { name: 'My Page', exact: true }),
    ).toBeVisible();
  });

  test('does not leak old revisions to anonymous visitors', async ({
    page,
  }) => {
    // a published page whose original title differs from the current one
    await createContent(page, {
      contentType: 'Document',
      contentId: 'public-page',
      contentTitle: 'Old secret title',
      transition: 'publish',
    });
    const patch = await page.request.patch(`${apiURL}/public-page`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      data: { title: 'Public title' },
    });
    expect(patch.ok()).toBeTruthy();

    // drop the auth cookie: the backend protects the @history endpoint, so
    // the version request must fail instead of serving the old revision
    await page.context().clearCookies();
    const response = await page.goto('/public-page?version=0');

    expect(response?.ok()).toBeFalsy();
    await expect(page.getByText('Old secret title')).toBeHidden();
  });

  test('hides the History toolbar button on the site root', async ({
    page,
  }) => {
    await page.goto('/my-page');
    await expect(page.getByRole('link', { name: 'History' })).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('link', { name: 'History' })).toBeHidden();
  });
});
