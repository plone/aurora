import ploneClient from '../../client';
import { createTestRule, setup, teardown } from '../../utils/test';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { v4 as uuid } from 'uuid';

const cli = ploneClient.initialize({
  apiPath: 'http://localhost:55001/plone',
});

await cli.login({ data: { login: 'admin', password: 'secret' } });

beforeEach(async () => {
  await setup();
});

afterEach(async () => {
  await teardown();
});

describe('Get Rules', () => {
  test('Successful', async () => {
    const ruleId = await createTestRule(cli, `Get rule ${uuid()}`);

    await cli.createRule({ path: '/', ruleId });

    const result = await cli.getRules({ path: '/' });

    expect(result.data['content-rules']?.assigned_rules.length).toBeGreaterThan(
      0,
    );
  });
});
