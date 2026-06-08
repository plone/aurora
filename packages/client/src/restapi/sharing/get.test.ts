import ploneClient from '../../client';
import { setup, teardown } from '../../utils/test';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { RequestError } from '../types';

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

describe('Get Sharing', () => {
  test('Successful', async () => {
    const path = '/';

    const result = await cli.getSharing({ path });

    expect(result.data.inherit).toBe(true);
  });

  test('Successful - page', async () => {
    const contentData = {
      '@type': 'Document',
      title: 'sharingtest',
    };

    await cli.createContent({ path: '/', data: contentData });

    const result = await cli.getSharing({ path: contentData.title });

    expect(result.data.inherit).toBe(true);
  });

  // TODO test sharing with search param

  test('Failure', async () => {
    const path = 'blah';

    try {
      await cli.getSharing({ path });
    } catch (err) {
      expect((err as RequestError).status).toBe(404);
    }
  });
});
