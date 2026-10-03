import { setup, teardown } from '../../utils/test';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import PloneClient from '../../client';
import type { RequestError } from '../types';

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

describe('Sharing', () => {
  test('Successful', async () => {
    const path = '/';
    const contentData = {
      '@type': 'Document',
      title: 'sharingpage',
    };
    await cli.createContent({ path, data: contentData });

    const result = await cli.updateSharing({
      path: contentData.title,
      data: {
        entries: [
          {
            id: 'AuthenticatedUsers',
            roles: {
              Contributor: true,
              Editor: false,
              Reader: false,
              Reviewer: false,
            },
            type: 'group',
          },
        ],
        inherit: false,
      },
    });

    expect(result.status).toBe(204);
  });

  test('Failure', async () => {
    const path = '/';
    const contentData = {
      '@type': 'Document',
      title: 'sharingpage',
    };
    await cli.createContent({ path, data: contentData });

    try {
      await cli.updateSharing({
        path: 'blah',
        data: {
          entries: [
            {
              id: 'AuthenticatedUsers',
              roles: {
                Contributor: true,
                Editor: false,
                Reader: false,
                Reviewer: false,
              },
              type: 'group',
            },
          ],
        },
      });
    } catch (err) {
      expect((err as RequestError).status).toBe(404);
    }
  });
});
