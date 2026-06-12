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

describe('Rule', () => {
  test('Successful', async () => {
    const ruleId = await createTestRule(cli, `Add rule ${uuid()}`);

    const result = await cli.createRule({ path: '/', ruleId });

    expect(result.data.message).toBe(
      `Successfully assigned the rule ${ruleId}`,
    );
  });
});
