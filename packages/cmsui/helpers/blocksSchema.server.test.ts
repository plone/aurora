import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '@plone/registry';
import { cookie } from '@plone/react-router';
import blocksDocs from '@plone/registry/blocks-docs';
import {
  blocksSchemaContentResource,
  blocksSchemaResponse,
  clearValidatedTokens,
} from './blocksSchema.server';
import { loader } from '../routes/blocksSchema';

const getUser = vi.fn();
const getContent = vi.fn();
const initialize = vi.fn(() => ({ getUser, getContent }));

vi.mock('@plone/aurora/app/middleware.server', () => ({
  getPloneClientClass: () => ({ initialize }),
}));

const base64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const makeToken = (payload: object) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;
const token = makeToken({ sub: 'editor', exp: inAnHour() });

const request = (
  path: string,
  {
    auth = token,
    headers = {},
  }: { auth?: string | null; headers?: object } = {},
) =>
  new Request(`http://localhost${path}`, {
    headers: {
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...headers,
    },
  });

const docs = [
  {
    block: 'teaser',
    markdown: '---\nblock: teaser\n---\n\nLinks to one item.\n\n### Fields',
  },
  {
    block: '__somersault__',
    markdown: '---\nblock: __somersault__\n---\n\nOne document.',
  },
  {
    element: 'callout',
    title: 'Callout',
    markdown:
      '---\nelement: callout\ntitle: Callout\n---\n\nA box.\n\n### Example',
  },
];

const blockIds = (body: { items: Array<{ id: string; kind: string }> }) =>
  body.items.filter((item) => item.kind === 'block').map((item) => item.id);

beforeEach(() => {
  clearValidatedTokens();
  getUser.mockResolvedValue({ data: { id: 'editor' } });
  getContent.mockResolvedValue({
    data: {
      '@id': 'http://localhost:8080/Plone/events',
      '@type': 'Folder',
      '@components': {
        navroot: { navroot: { '@id': 'http://localhost:8080/Plone' } },
      },
    },
  });
  config.settings.apiPath = 'http://localhost:8080/Plone';
  config.blocks.blocksConfig = {
    teaser: {
      id: 'teaser',
      title: 'Teaser',
      blockSchema: () => ({
        title: 'Teaser',
        fieldsets: [],
        properties: { href: { title: 'Target' } },
        required: [],
      }),
    },
    hidden: { id: 'hidden', title: 'Hidden', restricted: true },
    events: {
      id: 'events',
      title: 'Events',
      restricted: ({ contentType }: { contentType: string }) =>
        contentType !== 'Folder',
    },
  } as any;
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('authentication', () => {
  it('needs a token', async () => {
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema', { auth: null }),
      docsFiles: docs,
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({
      error: { type: 'Unauthorized', message: 'Authentication is required.' },
    });
  });

  it('answers in Markdown when asked to', async () => {
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema', {
        auth: null,
        headers: { Accept: 'text/markdown' },
      }),
      docsFiles: docs,
    });
    expect(response.status).toBe(401);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(await response.text()).toBe('Authentication is required.\n');
  });

  it('rejects malformed and expired tokens without asking Plone', async () => {
    for (const auth of [
      'not-a-token',
      makeToken({ sub: 'editor', exp: 1 }),
      makeToken({ exp: inAnHour() }),
    ]) {
      const response = await blocksSchemaResponse({
        request: request('/@blocks-schema', { auth }),
        docsFiles: docs,
      });
      expect(response.status).toBe(401);
    }
    expect(getUser).not.toHaveBeenCalled();
  });

  it('rejects a token that Plone does not accept', async () => {
    getUser.mockRejectedValue({ status: 401 });
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema'),
      docsFiles: docs,
    });
    expect(response.status).toBe(401);
  });

  it('validates the token with Plone, once', async () => {
    await blocksSchemaResponse({
      request: request('/@blocks-schema'),
      docsFiles: docs,
    });
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema/teaser'),
      docsFiles: docs,
    });

    expect(response.status).toBe(200);
    expect(initialize).toHaveBeenCalledWith({
      apiPath: 'http://localhost:8080/Plone',
      token,
    });
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(getUser).toHaveBeenCalledWith({ id: 'editor' });
  });

  it('reads the session cookie', async () => {
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema', {
        auth: null,
        headers: { Cookie: await cookie.serialize(token) },
      }),
      docsFiles: docs,
    });
    expect(response.status).toBe(200);
  });

  it('passes other backend errors on', async () => {
    getUser.mockRejectedValue({ status: 500 });
    await expect(
      blocksSchemaResponse({
        request: request('/@blocks-schema'),
        docsFiles: docs,
      }),
    ).rejects.toEqual({ status: 500 });
  });
});

describe('the list of blocks', () => {
  it('has a summary of every block and the document format', async () => {
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema'),
      docsFiles: docs,
    });

    expect(response.headers.get('Cache-Control')).toBe('private, max-age=300');
    expect(response.headers.get('Vary')).toBe(
      'Accept, Accept-Language, Authorization, Cookie',
    );
    expect(await response.json()).toEqual({
      '@id': 'http://localhost/@blocks-schema',
      document: 'One document.',
      items: [
        {
          '@id': 'http://localhost/@blocks-schema/callout',
          id: 'callout',
          title: 'Callout',
          kind: 'element',
          description: 'A box.',
        },
        {
          '@id': 'http://localhost/@blocks-schema/teaser',
          id: 'teaser',
          title: 'Teaser',
          kind: 'block',
          description: 'Links to one item.',
        },
        {
          '@id': 'http://localhost/@blocks-schema/hidden',
          id: 'hidden',
          title: 'Hidden',
          kind: 'block',
          restricted: true,
        },
        {
          '@id': 'http://localhost/@blocks-schema/events',
          id: 'events',
          title: 'Events',
          kind: 'block',
          restricted: 'context',
        },
      ],
      items_total: 4,
    });
  });

  it('ignores the query string', async () => {
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema?format=md&full=1'),
      docsFiles: docs,
    });
    expect(response.headers.get('Content-Type')).toContain('application/json');
    const body = await response.json();
    expect(body['@id']).toBe('http://localhost/@blocks-schema');
    expect(body.items[1]).not.toHaveProperty('docs');
  });

  it('links each item with the public protocol and host', async () => {
    const response = await blocksSchemaResponse({
      request: new Request('http://example.com:3000/@blocks-schema/', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Forwarded-Proto': 'https, http',
        },
      }),
      docsFiles: docs,
    });
    const body = await response.json();
    expect(body['@id']).toBe('https://example.com:3000/@blocks-schema');
    expect(body.items[1]['@id']).toBe(
      'https://example.com:3000/@blocks-schema/teaser',
    );
  });

  it('links a block by its blocksConfig key', async () => {
    (config.blocks.blocksConfig as any)['my block'] = {
      id: 'myBlock',
      title: 'My block',
    };
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema'),
      docsFiles: docs,
    });
    const { items } = await response.json();
    expect(items.find((item: any) => item.id === 'myBlock')['@id']).toBe(
      'http://localhost/@blocks-schema/my%20block',
    );
  });

  it('is one Markdown document', async () => {
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema', {
        headers: { Accept: 'text/markdown' },
      }),
      docsFiles: docs,
    });
    const markdown = await response.text();

    expect(response.headers.get('Content-Type')).toBe(
      'text/markdown; charset=utf-8',
    );
    expect(markdown).toMatch(/^# Blocks\n/);
    expect(markdown).toContain('## Document format\n\nOne document.');
    expect(markdown).toContain(
      '## Elements\n\n- [Callout](http://localhost/@blocks-schema/callout) (`callout`): A box.',
    );
    expect(markdown).toContain(
      '## Blocks\n\n- [Teaser](http://localhost/@blocks-schema/teaser) (`teaser`): Links to one item.\n' +
        '- [Hidden](http://localhost/@blocks-schema/hidden) (`hidden`) _Not offered in the block chooser._\n' +
        '- [Events](http://localhost/@blocks-schema/events) (`events`) _Offered depending on the content._',
    );
    expect(markdown).not.toContain('### Schema');
  });
});

describe('one block', () => {
  it('has its docs and schema', async () => {
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema/teaser'),
      blockId: 'teaser',
      docsFiles: docs,
    });
    expect(await response.json()).toEqual({
      '@id': 'http://localhost/@blocks-schema/teaser',
      id: 'teaser',
      title: 'Teaser',
      kind: 'block',
      docs: 'Links to one item.\n\n### Fields',
      schema: expect.objectContaining({
        properties: { href: { title: 'Target' } },
      }),
    });
  });

  it('describes an element', async () => {
    const response = await blocksSchemaResponse({
      request: request('/@blocks-schema/callout'),
      blockId: 'callout',
      docsFiles: docs,
    });
    expect(await response.json()).toEqual({
      '@id': 'http://localhost/@blocks-schema/callout',
      id: 'callout',
      title: 'Callout',
      kind: 'element',
      docs: 'A box.\n\n### Example',
    });
  });

  it('is 404 when the block is not registered', async () => {
    for (const blockId of ['nope', '__somersault__']) {
      const response = await blocksSchemaResponse({
        request: request(`/@blocks-schema/${blockId}`),
        blockId,
        docsFiles: docs,
      });
      expect(response.status).toBe(404);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
  });
});

describe('for a content item', () => {
  it('only lists the blocks offered there', async () => {
    getContent.mockResolvedValue({
      data: { '@id': 'http://localhost:8080/Plone/news', '@type': 'Document' },
    });
    const response = await blocksSchemaContentResource({
      request: request('/news/@blocks-schema'),
      path: '/news',
    });
    const body = await response.json();

    expect(getContent).toHaveBeenCalledWith({
      path: '/news',
      expand: ['navroot'],
    });
    expect(response.headers.get('Cache-Control')).toBe(
      'private, max-age=0, must-revalidate',
    );
    expect(blockIds(body)).toEqual(['teaser']);
    // Elements are always offered.
    expect(body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'p' })]),
    );
    expect(
      body.items.find((item: any) => item.id === 'teaser'),
    ).not.toHaveProperty('restricted');
  });

  it('keeps the content path in the links', async () => {
    const response = await blocksSchemaContentResource({
      request: request('/news/@blocks-schema'),
      path: '/news',
    });
    const body = await response.json();
    expect(body['@id']).toBe('http://localhost/news/@blocks-schema');
    expect(body.items.find((item: any) => item.id === 'teaser')['@id']).toBe(
      'http://localhost/news/@blocks-schema/teaser',
    );

    const detail = await blocksSchemaContentResource({
      request: request('/news/@blocks-schema/teaser'),
      path: '/news',
      subpath: 'teaser',
    });
    expect((await detail.json())['@id']).toBe(
      'http://localhost/news/@blocks-schema/teaser',
    );
  });

  it('evaluates restricted with the content, its navroot and the user', async () => {
    const restricted = vi.fn(() => false);
    (config.blocks.blocksConfig as any).events.restricted = restricted;

    const response = await blocksSchemaContentResource({
      request: request('/events/@blocks-schema'),
      path: '/events',
    });
    const body = await response.json();

    expect(blockIds(body)).toEqual(['teaser', 'events']);
    expect(restricted).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ '@id': '/events' }),
        navRoot: { '@id': '/' },
        contentType: 'Folder',
        user: { id: 'editor' },
      }),
    );
  });

  it('flags one block as restricted or not', async () => {
    const response = await blocksSchemaContentResource({
      request: request('/events/@blocks-schema/hidden'),
      path: '/events',
      subpath: 'hidden',
    });
    expect(await response.json()).toMatchObject({
      id: 'hidden',
      restricted: true,
    });
  });

  it('passes the backend errors for the content on', async () => {
    getContent.mockRejectedValue({ status: 404 });
    const response = await blocksSchemaContentResource({
      request: request('/missing/@blocks-schema'),
      path: '/missing',
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        type: 'Not Found',
        message: "Could not get the content at '/missing'.",
      },
    });
  });

  it('treats a failing restricted function as restricted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (config.blocks.blocksConfig as any).events.restricted = () => {
      throw new Error('boom');
    };
    const response = await blocksSchemaContentResource({
      request: request('/events/@blocks-schema'),
      path: '/events',
    });
    const body = await response.json();
    expect(blockIds(body)).toEqual(['teaser']);
  });
});

describe('the route', () => {
  it('describes one block, with the docs collected at build time', async () => {
    const response = await loader({
      request: request('/@blocks-schema/teaser'),
      params: { blockId: 'teaser' },
    } as any);
    const body = await response.json();
    const teaserDocs = blocksDocs.find((file) => file.block === 'teaser');

    expect(teaserDocs).toBeDefined();
    expect(body.id).toBe('teaser');
    expect(body.docs).toMatch(/^Shows a card that links to one content item/);
  });

  it('describes the elements, with the docs collected at build time', async () => {
    const response = await loader({
      request: request('/@blocks-schema/h3'),
      params: { blockId: 'h3' },
    } as any);
    expect(await response.json()).toMatchObject({
      id: 'h3',
      title: 'Heading',
      kind: 'element',
      docs: expect.stringMatching(/^A section heading/),
    });
  });
});
