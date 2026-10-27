import { setup, teardown } from '../../utils/test';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import PloneClient from '../../client';

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

describe('Update Type Schema', () => {
  test('Successful', async () => {
    const { data: schema } = await cli.getType({ type: 'Document' });
    const [first, ...rest] = schema.fieldsets;

    await cli.updateTypeSchema({
      type: 'Document',
      data: {
        ...schema,
        fieldsets: [{ ...first, fields: [...first.fields, 'pages'] }, ...rest],
        properties: {
          ...schema.properties,
          pages: { title: 'Pages', factory: 'Integer', behavior: '' },
        },
      },
    });

    const { data: updated } = await cli.getType({ type: 'Document' });
    expect(updated.properties).toHaveProperty('pages');
    expect(updated.fieldsets[0].fields).toContain('pages');
  });
});
