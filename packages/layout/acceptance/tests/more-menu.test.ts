import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';

test.setTimeout(45_000);
test('More menu changes workflow and opens history and sharing', async ({
  page,
}) => {
  const api = process.env.API_PATH || 'http://127.0.0.1:55001/plone';
  const { token } = await login(page);
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const id = `moremenutest${Date.now()}`;
  const created = await page.request.post(api, {
    headers,
    data: { '@type': 'Document', id, title: 'More menu test' },
  });
  expect(created.ok()).toBeTruthy();
  try {
    await page.goto(`/${id}`, { waitUntil: 'networkidle' });
    const toolbar = page.getByRole('navigation', { name: 'Toolbar' });
    await toolbar.getByRole('button', { name: 'More' }).click();
    await expect(
      page.getByRole('menuitem', { name: /State.*Private/i }),
    ).toBeVisible();
    await page.getByRole('menuitem', { name: /State.*Private/i }).click();
    const dropdown = page.locator('.more-menu-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'History' })).toBeVisible();
    await expect(dropdown.getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: /State.*Private/i }),
    ).toBeVisible();
    await page
      .getByRole('menuitem', { name: /State.*Private/i })
      .press('ArrowRight');
    await page.getByRole('menuitem', { name: 'Publish', exact: true }).click();
    await expect
      .poll(async () => {
        const response = await page.request.get(`${api}/${id}/@workflow`, {
          headers,
        });
        return (await response.json()).state.id;
      })
      .toBe('published');
    await page.reload({ waitUntil: 'networkidle' });
    await toolbar.getByRole('button', { name: 'More' }).click();
    await expect(
      page.getByRole('menuitem', { name: /State.*Published/i }),
    ).toBeVisible();
    await page.getByRole('menuitem', { name: 'History' }).click();
    await expect(
      page.getByRole('heading', { name: /History.*More menu test/ }),
    ).toBeVisible();
    await expect(
      page.getByText('Publish', { exact: true }).first(),
    ).toBeVisible();
    await page.goto(`/${id}`, { waitUntil: 'networkidle' });
    await toolbar.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'URL management' }).click();
    const alias = `/${id}-alias`;
    await page.getByLabel('New URL alias').fill(alias);
    await page.getByRole('button', { name: 'Add alias' }).click();
    const removeAlias = page.getByRole('button', { name: `Remove ${alias}` });
    await expect(removeAlias).toBeVisible();
    await removeAlias.click();
    await expect(removeAlias).toHaveCount(0);
    await page.goto(`/${id}`, { waitUntil: 'networkidle' });
    await toolbar.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Links and references' }).click();
    await expect(
      page.getByRole('heading', {
        name: /Links and references.*More menu test/,
      }),
    ).toBeVisible();
    await expect(page.getByText('No links or references found.')).toBeVisible();
    await page.goto(`/@@rules/${id}`, { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: /Rules.*More menu test/ }),
    ).toBeVisible();
    await expect(page.getByText('No rules assigned.')).toBeVisible();
    await page.goto(`/${id}`, { waitUntil: 'networkidle' });
    await toolbar.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Sharing' }).click();
    await expect(page.getByRole('heading', { name: /Sharing/ })).toBeVisible();
  } finally {
    await page.request.delete(`${api}/${id}`, { headers });
  }
});

test('mobile toolbar opens a dismissible More sheet with workflow actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await page.goto('/news', { waitUntil: 'networkidle' });
  const toolbar = page.getByRole('navigation', { name: 'Toolbar' });
  const more = toolbar.getByRole('button', { name: 'More' });
  const bounds = await toolbar.boundingBox();
  expect(bounds?.width).toBe(375);
  expect(bounds?.y).toBeGreaterThan(700);
  const actions = ['More', 'Add content', 'Contents', 'Edit'];
  const actionBounds = await Promise.all(
    actions.map((name) =>
      toolbar
        .getByRole(name === 'Contents' || name === 'Edit' ? 'link' : 'button', {
          name,
        })
        .boundingBox(),
    ),
  );
  for (let i = 1; i < actionBounds.length; i++) {
    const previous = actionBounds[i - 1]!;
    const current = actionBounds[i]!;
    expect(current.x - (previous.x + previous.width)).toBeGreaterThanOrEqual(
      15,
    );
  }
  await page.setViewportSize({ width: 320, height: 812 });
  for (const name of actions) {
    const action = toolbar.getByRole(
      name === 'Contents' || name === 'Edit' ? 'link' : 'button',
      { name },
    );
    const box = await action.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await more.click();
  const sheet = page.locator('.toolbar-mobile-sheet');
  await expect(sheet.getByRole('dialog', { name: 'More' })).toBeVisible();
  await expect(sheet.getByRole('menu', { name: 'More' })).toBeVisible();
  const state = sheet.getByRole('menuitem', { name: /State/i });
  await expect(sheet).not.toHaveAttribute('data-entering');
  await expect(state).toBeEnabled();
  await state.click({ timeout: 5000 });
  await expect(page.locator('.more-menu-dropdown')).toBeVisible();
  const dropdown = page.locator('.more-menu-dropdown');
  await expect(dropdown).toHaveCSS('width', '180px');
  await expect(dropdown).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(dropdown.getByRole('menuitem').first()).toHaveCSS(
    'padding',
    '6px 12px',
  );
  const dropdownBounds = await dropdown.boundingBox();
  expect(dropdownBounds?.x).toBeGreaterThanOrEqual(0);
  expect(
    (dropdownBounds?.x ?? 0) + (dropdownBounds?.width ?? 0),
  ).toBeLessThanOrEqual(375);
  await page.keyboard.press('Escape');
  await sheet.getByRole('button', { name: 'Close More' }).click();
  await expect(sheet).not.toBeVisible();
  await expect(more).toBeFocused();
  await page.setViewportSize({ width: 1024, height: 768 });
  await more.click();
  await expect(page.getByRole('menu', { name: 'More' })).toBeVisible();
});

test('mobile toolbar keeps the other menus and CMS page accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await page.goto('/news', { waitUntil: 'networkidle' });
  const toolbar = page.getByRole('navigation', { name: 'Toolbar' });
  await toolbar.getByRole('button', { name: 'Personal tools' }).click();
  const personalMenu = page.getByRole('menu', { name: /personal tools/i });
  await expect(personalMenu).toBeVisible();
  const personalBounds = await personalMenu.boundingBox();
  expect(personalBounds?.x).toBeGreaterThanOrEqual(0);
  expect(
    (personalBounds?.x ?? 0) + (personalBounds?.width ?? 0),
  ).toBeLessThanOrEqual(375);
  await page.keyboard.press('Escape');
  await toolbar.getByRole('button', { name: 'Add content' }).click();
  await expect(page.getByRole('menu', { name: /add content/i })).toBeVisible();
  await page.goto('/controlpanel', { waitUntil: 'networkidle' });
  const bodyWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  expect(bodyWidth).toBe(375);
  const bar = await page
    .getByRole('navigation', { name: 'Toolbar' })
    .boundingBox();
  expect(bar?.width).toBe(375);
});

test('desktop State dropdown uses its compact styling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await page.goto('/news', { waitUntil: 'networkidle' });
  await page
    .getByRole('navigation', { name: 'Toolbar' })
    .getByRole('button', { name: 'More' })
    .click();
  const state = page.getByRole('menuitem', { name: /State/i });
  await expect(state).toBeEnabled();
  await state.click();
  const dropdown = page.locator('.more-menu-dropdown');
  await expect(dropdown).toBeVisible();
  await expect(dropdown).toHaveCSS('width', '180px');
  await expect(dropdown).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(dropdown.getByRole('menuitem').first()).toHaveCSS(
    'padding',
    '6px 12px',
  );
  await expect(dropdown.getByRole('menuitem').first()).toBeFocused();
});
