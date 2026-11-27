import { afterEach, describe, expect, it } from 'vitest';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import config from '@plone/registry';
import {
  MAIN_REGION,
  PLATE_TYPE,
  SOMERSAULT_KEY,
} from '@plone/plate/constants';
import type { Content, ContentBase } from '@plone/types';
import installMigrations from './migrations.server';
import { migrateContent } from './content-migrations.server';

type TestContent = Partial<ContentBase> & {
  '@id': string;
  title: string;
  blocks: Record<string, unknown>;
  blocks_layout: {
    items: string[];
  };
};

describe('content migrations', () => {
  afterEach(() => {
    config.settings = {};
    config.blocks = {} as typeof config.blocks;
    const utilities = config.utilities as Partial<Record<string, unknown>>;
    delete utilities.somersaultBlockMigration;
    delete utilities.somersaultMigration;
    delete utilities.contentMigration;
  });

  it('migrates title and legacy value blocks into the main region', () => {
    config.blocks = {
      blocksConfig: {},
    } as typeof config.blocks;
    installMigrations();

    const content: TestContent = {
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
    };

    const migrated = migrateContent(content as unknown as Content);

    expect(migrated.blocks?.[MAIN_REGION]).toEqual({
      '@type': PLATE_TYPE,
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

  it('migrates legacy flat blockquotes into blockquote containers', () => {
    config.blocks = {
      blocksConfig: {},
    } as typeof config.blocks;
    installMigrations();

    const content: TestContent = {
      '@id': 'http://example.com/',
      title: 'Page title',
      blocks: {
        quote: {
          '@type': 'slate',
          value: [
            {
              type: 'blockquote',
              children: [
                { text: 'Quoted ' },
                {
                  type: 'link',
                  data: { url: 'https://plone.org' },
                  children: [{ text: 'text' }],
                },
              ],
            },
          ],
        },
      },
      blocks_layout: {
        items: ['quote'],
      },
    };

    const migrated = migrateContent(content as unknown as Content);
    const [blockquote] = (
      migrated.blocks?.[MAIN_REGION] as unknown as { value: any[] }
    ).value;

    expect(blockquote).toMatchObject({
      type: 'blockquote',
      children: [
        {
          type: 'p',
          children: [
            { text: 'Quoted ' },
            {
              type: 'a',
              url: 'https://plone.org',
              children: [{ text: 'text' }],
            },
          ],
        },
      ],
    });
    expect(blockquote.children).toHaveLength(1);
  });

  it('moves native blocks into the main region as ploneBlock nodes', () => {
    config.blocks = {
      blocksConfig: {
        listing: {},
        image: {},
        configuredWidth: {
          defaultBlockWidth: 'layout',
          blockSchema: {
            title: 'Configured width block',
            fieldsets: [],
            required: [],
            properties: {},
          },
        },
        schemaWidth: {
          blockSchema: {
            title: 'Schema width block',
            fieldsets: [],
            required: [],
            properties: {
              blockWidth: {
                widget: 'width',
                default: 'full',
                styleField: true,
              },
            },
          },
        },
      },
    } as unknown as typeof config.blocks;
    installMigrations();

    const content: TestContent = {
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
        configuredWidth: {
          '@type': 'configuredWidth',
        },
        schemaWidth: {
          '@type': 'schemaWidth',
        },
        custom: {
          '@type': 'custom-unregistered',
          foo: 'bar',
        },
      },
      blocks_layout: {
        items: [
          'titleBlock',
          'listing',
          'image',
          'configuredWidth',
          'schemaWidth',
          'custom',
        ],
      },
    };

    const migrated = migrateContent(content as unknown as Content);

    expect(migrated.blocks?.[MAIN_REGION]).toEqual({
      '@type': PLATE_TYPE,
      value: [
        {
          blockWidth: 'default',
          type: 'title',
          children: [{ text: 'Page title' }],
        },
        {
          '@type': 'listing',
          blockWidth: 'default',
          children: [{ text: '' }],
          querystring: {
            criteria: [],
          },
          type: PLONE_BLOCK_TYPE,
        },
        {
          '@type': 'image',
          alt: 'Example image',
          blockWidth: 'default',
          children: [{ text: '' }],
          type: PLONE_BLOCK_TYPE,
          url: '/image',
        },
        {
          '@type': 'configuredWidth',
          blockWidth: 'layout',
          children: [{ text: '' }],
          type: PLONE_BLOCK_TYPE,
        },
        {
          '@type': 'schemaWidth',
          blockWidth: 'full',
          children: [{ text: '' }],
          type: PLONE_BLOCK_TYPE,
        },
      ],
    });
  });

  describe('legacy __somersault__ block', () => {
    const legacyValue = [
      { type: 'title', children: [{ text: 'Stored title' }] },
      { type: 'p', children: [{ text: 'Stored text' }] },
    ];

    it('renames it to the main region with the plate type', () => {
      config.blocks = { blocksConfig: {} } as typeof config.blocks;
      installMigrations();

      const content: TestContent = {
        '@id': 'http://example.com/',
        title: 'Page title',
        blocks: {
          [SOMERSAULT_KEY]: {
            '@type': SOMERSAULT_KEY,
            value: legacyValue,
            discussions: { d1: {} },
          },
          a: {
            '@type': 'slate',
            value: [{ type: 'p', children: [{ text: 'Legacy block' }] }],
          },
        },
        blocks_layout: { items: [SOMERSAULT_KEY, 'a'] },
      };

      const migrated = migrateContent(content as unknown as Content);

      expect(migrated).toBe(content);
      expect(migrated.blocks_layout?.items).toEqual(['a']);
      expect(migrated.blocks?.[SOMERSAULT_KEY]).toBeUndefined();
      // The value is kept as stored, not rebuilt from the legacy blocks, and
      // any other data of the block travels with it.
      expect(migrated.blocks?.[MAIN_REGION]).toEqual({
        '@type': PLATE_TYPE,
        value: legacyValue,
        discussions: { d1: {} },
      });
    });

    it('keeps the main region and drops the legacy block when both exist', () => {
      config.blocks = { blocksConfig: {} } as typeof config.blocks;
      installMigrations();
      const mainValue = [{ type: 'p', children: [{ text: 'New' }] }];

      const content: TestContent = {
        '@id': 'http://example.com/',
        title: 'Page title',
        blocks: {
          [MAIN_REGION]: { '@type': PLATE_TYPE, value: mainValue },
          [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value: legacyValue },
        },
        blocks_layout: { items: [] },
      };

      const migrated = migrateContent(content as unknown as Content);

      expect(migrated.blocks).toEqual({
        [MAIN_REGION]: { '@type': PLATE_TYPE, value: mainValue },
      });
    });

    it('is idempotent', () => {
      config.blocks = { blocksConfig: {} } as typeof config.blocks;
      installMigrations();

      const content: TestContent = {
        '@id': 'http://example.com/',
        title: 'Page title',
        blocks: {
          [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value: legacyValue },
        },
        blocks_layout: { items: [] },
      };

      const once = structuredClone(
        migrateContent(content as unknown as Content),
      );
      const twice = migrateContent(content as unknown as Content);

      expect(twice).toEqual(once);
    });
  });
});
