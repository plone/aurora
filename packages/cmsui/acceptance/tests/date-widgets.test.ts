import { expect, test } from '../../../tooling/playwright/test';
import { login } from '../../../tooling/playwright/login';
import { createContent } from '../../../tooling/playwright/content';

const API = process.env.API_PATH || 'http://localhost:55001/plone';
const auth = {
  Accept: 'application/json',
  Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
};

// Plone stores date-times in UTC. The date-time widget shows them in the
// browser's time zone, and stores the edited value in UTC again.
test.use({ timezoneId: 'Europe/Madrid', locale: 'en-US' });

test('A date-time field shows local time and saves UTC', async ({
  page,
  request,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Event',
    contentId: 'dated-event',
    contentTitle: 'Dated event',
    bodyModifier: (body) => ({
      ...body,
      start: '2026-10-05T10:00:00+00:00',
      end: '2026-10-05T11:00:00+00:00',
    }),
  });

  await page.goto('/@@edit/dated-event', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Content' }).click();

  // 10:00 UTC is 12:00 in Madrid, in summer time.
  const start = page.getByRole('group', { name: 'Event Starts' });
  const hour = start.getByRole('spinbutton', { name: /hour/i });
  await expect(hour).toHaveText('12');

  await hour.focus();
  await page.keyboard.press('ArrowUp');
  await expect(hour).toHaveText('1');

  const saved = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.ok(),
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saved;

  const event = await (
    await request.get(`${API}/dated-event`, { headers: auth })
  ).json();
  expect(event.start).toBe('2026-10-05T11:00:00+00:00');
  expect(event.end).toBe('2026-10-05T11:00:00+00:00');
});
