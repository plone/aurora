import { expect, test as base } from '@playwright/test';

import { setup, teardown } from './reset-fixture';
import { acceptanceBackend } from './backend';
import { nickLogs, resetNick } from './nick-reset';

type TestFixtures = {
  resetBackend: void;
};

export const test = base.extend<TestFixtures>({
  resetBackend: [
    async ({ page, request }, use, testInfo) => {
      const backend = acceptanceBackend();
      const startedAt = new Date();
      if (backend === 'nick') {
        if (testInfo.config.workers !== 1) {
          throw new Error('Nick acceptance tests require exactly one worker');
        }
        await resetNick();
      } else {
        await teardown(request);
        await setup(request);
      }

      try {
        await use();
      } finally {
        if (backend === 'nick' && testInfo.status !== testInfo.expectedStatus) {
          const logs = await nickLogs(startedAt).catch(
            () => 'Could not read Nick logs',
          );
          await testInfo.attach('nick-logs', {
            body: logs,
            contentType: 'text/plain',
          });
        }
        // Close the live page before resetting the backend so teardown does
        // not trigger refresh noise that obscures the real test failure.
        await page.close().catch(() => {});
        if (backend === 'plone') await teardown(request);
      }
    },
    { auto: true, timeout: 180_000 },
  ],
});

export { expect };
