import ploneClient from '../../client';
import { setup, teardown } from '../../utils/test';
import { afterEach, beforeEach, describe, test, expect } from 'vitest';
import type { RequestError } from '../types';

const cli = ploneClient.initialize({
  apiPath: 'http://localhost:55001/plone',
});

// Versions are permission-protected, so the version tests need a logged-in
// client (same pattern as update.test.ts).
const authCli = ploneClient.initialize({
  apiPath: 'http://localhost:55001/plone',
});
await authCli.login({ data: { login: 'admin', password: 'secret' } });

beforeEach(async () => {
  await setup();
});

afterEach(async () => {
  await teardown();
});

describe('getContent', () => {
  test('Successful', async () => {
    const path = '/';
    const result = await cli.getContent({ path });
    expect(result.data.title).toBe('Welcome to Plone');
  });

  test('Failure', async () => {
    const path = '/blah';
    try {
      await cli.getContent({ path });
    } catch (err) {
      expect((err as RequestError).status).toBe(404);
    }
  });

  test('Fullobjects', async () => {
    const path = '/';
    const fullObjects = true;
    const result = await cli.getContent({ path, fullObjects });
    expect(result.data.title).toBe('Welcome to Plone');
  });

  test('Expand', async () => {
    const path = '/';
    const result = await cli.getContent({
      path,
      expand: ['breadcrumbs', 'navigation'],
    });

    expect(result.data.title).toBe('Welcome to Plone');
    expect(result.data['@components'].breadcrumbs.root).toBe(
      'http://localhost:55001/plone',
    );
    expect(result.data['@components'].navigation.items.length).toBeGreaterThan(
      0,
    );
  });

  test('Version', async () => {
    await authCli.createContent({
      path: '/',
      data: { '@type': 'Document', title: 'Versioned Page' },
    });
    await authCli.updateContent({
      path: '/versioned-page',
      data: { title: 'Versioned Page updated' },
    });

    const result = await authCli.getContent({
      path: '/versioned-page',
      version: '0',
    });

    expect(result.data.title).toBe('Versioned Page');
  });

  test('Version & expand', async () => {
    await authCli.createContent({
      path: '/',
      data: { '@type': 'Document', title: 'Versioned Page' },
    });
    await authCli.updateContent({
      path: '/versioned-page',
      data: { title: 'Versioned Page updated' },
    });

    // expand must reach the @history endpoint too (it used to be dropped
    // whenever a version was requested)
    const result = await authCli.getContent({
      path: '/versioned-page',
      version: '0',
      expand: ['breadcrumbs', 'navigation'],
    });

    expect(result.data.title).toBe('Versioned Page');
    expect(result.data['@components'].breadcrumbs.root).toBe(
      'http://localhost:55001/plone',
    );
    expect(result.data['@components'].navigation.items.length).toBeGreaterThan(
      0,
    );
  });
});
