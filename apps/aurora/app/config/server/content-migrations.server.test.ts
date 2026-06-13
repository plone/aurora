import { afterEach, describe, expect, it } from 'vitest';
import config from '@plone/registry';
import { SOMERSAULT_KEY } from '@plone/plate/constants';
import type { Content } from '@plone/types';
import installMigrations from './migrations.server';
import { migrateContent } from './content-migrations.server';

describe('content migrations', () => {
  afterEach(() => {
    config.settings = {};
    config.blocks = {} as typeof config.blocks;
    const utilities = config.utilities as Partial<Record<string, unknown>>;
    delete utilities.somersaultBlockMigration;
    delete utilities.somersaultMigration;
  });

  it('migrates title and legacy value blocks into the somersault block', () => {
    config.blocks = {
      blocksConfig: {},
    } as typeof config.blocks;
    installMigrations();

    const content: Content = {
      '@id': 'http://example.com/',
      title: 'Page title',
      blocks: {
        text: {
          '@type': 'slate',
          value: [{ type: 'p', children: [{ text: 'First block' }] }],
        },
        titleBlock: {
          '@type': 'title',
        },
      },
      blocks_layout: {
        items: ['text', 'titleBlock'],
      },
    } as Content;

    const migrated = migrateContent(content);

    expect(migrated.blocks?.[SOMERSAULT_KEY]).toEqual({
      '@type': SOMERSAULT_KEY,
      value: [
        {
          blockWidth: 'default',
          type: 'p',
          children: [{ text: 'First block' }],
        },
        {
          blockWidth: 'default',
          type: 'title',
          children: [{ text: 'Page title' }],
        },
      ],
    });
  });

  it('moves native blocks into the somersault field as unknown nodes', () => {
    config.blocks = {
      blocksConfig: {
        listing: {},
        image: {},
      },
    } as typeof config.blocks;
    installMigrations();

    const content: Content = {
      '@id': 'http://example.com/',
      title: 'Page title',
      blocks: {
        titleBlock: {
          '@type': 'title',
        },
        listing: {
          '@type': 'listing',
          querystring: {
            criteria: [],
          },
        },
        image: {
          '@type': 'image',
          url: '/image',
          alt: 'Example image',
        },
        custom: {
          '@type': 'custom-unregistered',
          foo: 'bar',
        },
      },
      blocks_layout: {
        items: ['titleBlock', 'listing', 'image', 'custom'],
      },
    } as Content;

    const migrated = migrateContent(content);

    expect(migrated.blocks?.[SOMERSAULT_KEY]).toEqual({
      '@type': SOMERSAULT_KEY,
      value: [
        {
          blockWidth: 'default',
          type: 'title',
          children: [{ text: 'Page title' }],
        },
        {
          '@type': 'listing',
          children: [{ text: '' }],
          querystring: {
            criteria: [],
          },
          type: 'unknown',
        },
        {
          '@type': 'image',
          alt: 'Example image',
          children: [{ text: '' }],
          type: 'unknown',
          url: '/image',
        },
      ],
    });
  });
});
