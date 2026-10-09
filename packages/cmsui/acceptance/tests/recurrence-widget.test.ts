import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

const API = 'http://localhost:55001/plone';
const auth = {
  Accept: 'application/json',
  Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
};

test('An event recurrence edited in the modal is saved with the event', async ({
  page,
  request,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Event',
    contentId: 'weekly-event',
    contentTitle: 'Weekly event',
    bodyModifier: (body) => ({
      ...body,
      start: '2026-10-05T10:00:00+00:00',
      end: '2026-10-05T11:00:00+00:00',
    }),
  });

  await page.goto('/@@edit/weekly-event', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();

  // The recurrence widget is the innermost group with that label (the
  // fieldset panel is a group too). Its first button opens the modal.
  const widget = page
    .getByRole('group')
    .filter({ hasText: 'Recurrence' })
    .last();
  await widget.getByRole('button').first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Edit recurrence')).toBeVisible();
  await dialog.getByRole('button', { name: /Repeat/ }).click();
  await page.getByRole('option', { name: 'Weekly' }).click();
  await dialog.locator('button[type="submit"]').click();

  // The widget shows the rule from the content form.
  await expect(dialog).toBeHidden();
  await expect(widget).toContainText(/week/i);

  const saved = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;

  const event = await (
    await request.get(`${API}/weekly-event`, { headers: auth })
  ).json();
  expect(event.recurrence).toContain('FREQ=WEEKLY');
});
