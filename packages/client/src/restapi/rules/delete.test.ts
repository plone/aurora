import { createTestRule, setup, teardown } from '../../utils/test';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import PloneClient from '../../client';
import { v4 as uuid } from 'uuid';

const cli = PloneClient.initialize({
  apiPath: 'http://localhost:55001/plone',
});

await cli.login({ data: { login: 'admin', password: 'secret' } });

beforeEach(async () => {
  await setup();
});

afterEach(async () => {
  await teardown();
});

describe('Delete Rules', () => {
  test('Successful', async () => {
    const ruleId = await createTestRule(cli, `Delete rule ${uuid()}`);

    await cli.createRule({ path: '/', ruleId });

    const result = await cli.deleteRules({ path: '/', ruleIds: [ruleId] });
    expect(result.status).toBe(204);
  });
});
