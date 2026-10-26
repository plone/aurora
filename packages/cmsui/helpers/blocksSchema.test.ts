import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BlockConfigBase } from '@plone/types';
import {
  blocksToMarkdown,
  blockToMarkdown,
  buildFullDetail,
  buildSummaryItem,
  elementSummary,
  fillPlaceholders,
  getDocumentDocs,
  getElements,
  getSummary,
  resolveDocs,
  restrictedFlag,
  toJSONSafe,
  wantsMarkdown,
  type BlockDocsFile,
} from './blocksSchema';

const docs = (block: string, markdown: string, variation?: string) =>
  ({
    block,
    ...(variation ? { variation } : {}),
    markdown: `---\nblock: ${block}\n---\n\n${markdown}`,
  }) as BlockDocsFile;

const listing = {
  id: 'listing',
  title: 'Listing',
  maxItems: 6,
  blockSchema: ({ formData }: any) => ({
    title: 'Listing',
    fieldsets: [{ id: 'default', title: 'Default', fields: ['headline'] }],
    properties: {
      headline: { title: 'Headline', validator: () => null },
      help: { title: 'Help', description: React.createElement('a') },
    },
    required: [],
    variation: formData.variation,
  }),
  variations: [
    { id: 'default', title: 'Default', isDefault: true },
    {
      id: 'summary',
      title: 'Summary',
      schemaEnhancer: ({ schema }: any) => {
        schema.properties.summary = { title: 'Summary' };
        return schema;
      },
    },
  ],
} as unknown as BlockConfigBase;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('toJSONSafe', () => {
  it('drops functions, symbols and React elements', () => {
    expect(
      toJSONSafe({
        a: 1,
        fn: () => {},
        sym: Symbol('x'),
        el: React.createElement('div'),
        list: [1, () => {}, 'two'],
      }),
    ).toEqual({ a: 1, list: [1, 'two'] });
  });

  it('cuts cycles but keeps repeated values', () => {
    const shared = { title: 'Shared' };
    const value: any = { one: shared, two: shared };
    value.self = value;
    expect(toJSONSafe(value)).toEqual({ one: shared, two: shared });
  });

  it('uses toJSON', () => {
    expect(toJSONSafe({ date: new Date('2026-01-01T00:00:00Z') })).toEqual({
      date: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('fillPlaceholders', () => {
  it('fills strings, numbers and lists', () => {
    expect(
      fillPlaceholders('Up to {{max}} of {{allowed}}, {{ name }}.', {
        id: 'grid',
        max: 4,
        allowed: ['image', 'teaser'],
        name: 'grid',
      }),
    ).toBe('Up to 4 of `image`, `teaser`, grid.');
  });

  it('keeps escaped placeholders', () => {
    expect(fillPlaceholders('Write \\{{max}}.', { id: 'grid', max: 4 })).toBe(
      'Write {{max}}.',
    );
  });

  it('removes unknown placeholders with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(fillPlaceholders('A {{missing}} value.', { id: 'grid' })).toBe(
      'A  value.',
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('{{missing}}'));
  });
});

describe('docs', () => {
  const files = [
    docs(
      'listing',
      'Lists items.\nMatching a query.\n\n### Fields\n\nUp to {{maxItems}}.',
    ),
    docs('listing', 'Shows a summary.', 'summary'),
    docs('__somersault__', 'The page document.'),
  ];

  it('strips the frontmatter and fills the placeholders', () => {
    expect(resolveDocs(files, listing)).toBe(
      'Lists items.\nMatching a query.\n\n### Fields\n\nUp to 6.',
    );
    expect(resolveDocs(files, listing, 'summary')).toBe('Shows a summary.');
    expect(resolveDocs(files, { ...listing, id: 'other' })).toBe('');
  });

  it("is tailored by the block's docs function", () => {
    const tailored = {
      ...listing,
      docs: ({ markdown }: { markdown: string }) => `${markdown}\n\nMore.`,
    };
    expect(resolveDocs(files, tailored)).toMatch(/Up to 6\.\n\nMore\.$/);
  });

  it('falls back to the file when the docs function fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = {
      ...listing,
      docs: () => {
        throw new Error('boom');
      },
    };
    expect(resolveDocs(files, failing)).toMatch(/^Lists items\./);
    expect(resolveDocs(files, { ...listing, docs: () => 1 as any })).toMatch(
      /^Lists items\./,
    );
  });

  it('takes the first paragraph as the summary', () => {
    expect(getSummary('Lists items.\nMatching a query.\n\nMore.')).toBe(
      'Lists items. Matching a query.',
    );
    expect(buildSummaryItem(files, listing)).toEqual({
      id: 'listing',
      title: 'Listing',
      kind: 'block',
      description: 'Lists items. Matching a query.',
    });
    expect(buildSummaryItem([], listing)).toEqual({
      id: 'listing',
      title: 'Listing',
      kind: 'block',
    });
  });

  it('reads the document format docs', () => {
    expect(getDocumentDocs(files)).toBe('The page document.');
    expect(getDocumentDocs([])).toBe('');
  });
});

describe('buildFullDetail', () => {
  it('resolves the schema of the block and of each variation', () => {
    const detail = buildFullDetail(
      [docs('listing', 'Lists.'), docs('listing', 'Summary.', 'summary')],
      listing,
    );

    expect(detail).toMatchObject({ id: 'listing', docs: 'Lists.' });
    // Functions and React elements are dropped.
    expect(detail.schema?.properties).toEqual({
      headline: { title: 'Headline' },
      help: { title: 'Help' },
    });
    expect(detail.variations).toEqual([
      expect.objectContaining({
        id: 'default',
        isDefault: true,
        schema: expect.objectContaining({ variation: 'default' }),
      }),
      expect.objectContaining({
        id: 'summary',
        isDefault: false,
        docs: 'Summary.',
        schema: expect.objectContaining({
          variation: 'summary',
          properties: expect.objectContaining({
            summary: { title: 'Summary' },
          }),
        }),
      }),
    ]);
    expect(detail.variations?.[0]).not.toHaveProperty('docs');
  });

  it('returns a null schema for a block without one', () => {
    const detail = buildFullDetail([], {
      id: 'video',
      title: 'Video',
    } as BlockConfigBase);
    expect(detail).toEqual({
      id: 'video',
      title: 'Video',
      kind: 'block',
      docs: '',
      schema: null,
    });
  });

  it("doesn't fail when a schema can't be resolved", () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const detail = buildFullDetail([], {
      id: 'broken',
      title: 'Broken',
      blockSchema: () => {
        throw new Error('needs the editor');
      },
    } as unknown as BlockConfigBase);
    expect(detail.schema).toBeNull();
    expect(detail.error).toBe(
      'The schema for this block could not be resolved.',
    );
  });
});

describe('elements', () => {
  const files = [
    {
      element: 'h2',
      title: 'Heading',
      markdown:
        '---\nelement: h2, h3\ntitle: Heading\n---\n\nA heading.\n\nWidths: {{widths}}.',
    },
    {
      element: 'h3',
      title: 'Heading',
      markdown:
        '---\nelement: h2, h3\ntitle: Heading\n---\n\nA heading.\n\nWidths: {{widths}}.',
    },
    { element: 'callout', markdown: 'A box.' },
    docs('teaser', 'Links.'),
  ];

  it('lists the documented elements, with their placeholders filled', () => {
    expect(getElements(files, { h2: { widths: ['narrow'] } })).toEqual([
      {
        id: 'h2',
        title: 'Heading',
        kind: 'element',
        docs: 'A heading.\n\nWidths: `narrow`.',
      },
      expect.objectContaining({ id: 'h3', title: 'Heading' }),
      { id: 'callout', title: 'callout', kind: 'element', docs: 'A box.' },
    ]);
  });

  it('summarizes an element without its docs', () => {
    expect(
      elementSummary({
        id: 'callout',
        title: 'Callout',
        kind: 'element',
        docs: 'A box.\n\nMore.',
      }),
    ).toEqual({
      id: 'callout',
      title: 'Callout',
      kind: 'element',
      description: 'A box.',
    });
  });

  it('has a Markdown section that names its node type', () => {
    expect(
      blockToMarkdown({
        id: 'callout',
        title: 'Callout',
        kind: 'element',
        docs: 'A box.',
      }),
    ).toBe(
      '## Callout (`callout`)\n\n_An element of the document: a node with `"type": "callout"`._\n\nA box.',
    );
  });
});

describe('restrictedFlag', () => {
  it('flags the restricted blocks', () => {
    expect(restrictedFlag({ restricted: true } as BlockConfigBase)).toBe(true);
    expect(restrictedFlag({ restricted: false } as BlockConfigBase)).toBe(
      undefined,
    );
    expect(
      restrictedFlag({ restricted: () => true } as unknown as BlockConfigBase),
    ).toBe('context');
  });
});

describe('wantsMarkdown', () => {
  const request = (url: string, accept?: string) =>
    new Request(url, accept ? { headers: { Accept: accept } } : {});

  it('is true for format=md or a Markdown Accept header', () => {
    expect(
      wantsMarkdown(request('http://localhost/@blocks-schema?format=md')),
    ).toBe(true);
    expect(
      wantsMarkdown(
        request('http://localhost/@blocks-schema', 'text/markdown'),
      ),
    ).toBe(true);
  });

  it('is false for JSON or no preference', () => {
    expect(wantsMarkdown(request('http://localhost/@blocks-schema'))).toBe(
      false,
    );
    expect(
      wantsMarkdown(
        request(
          'http://localhost/@blocks-schema',
          'text/markdown, application/json',
        ),
      ),
    ).toBe(false);
  });
});

describe('Markdown', () => {
  it('has a section per block, with variations and schemas', () => {
    const markdown = blockToMarkdown({
      id: 'listing',
      title: 'Listing',
      kind: 'block',
      docs: 'Lists items.',
      schema: { title: 'Listing' } as any,
      restricted: 'context',
      variations: [
        {
          id: 'default',
          title: 'Default',
          isDefault: true,
          schema: { title: 'Listing' } as any,
        },
        {
          id: 'summary',
          title: 'Summary',
          isDefault: false,
          docs: 'Shows a summary.\nWith images.',
          schema: { title: 'Summary' } as any,
        },
      ],
    });

    expect(markdown).toContain(
      '## Listing (`listing`)\n\n_A Plone block: a `ploneBlock` node with `"@type": "listing"`._',
    );
    expect(markdown).toContain('depends on the content');
    expect(markdown).toContain(
      '- `default`: Default (default)\n- `summary`: Summary\n\n  Shows a summary.\n  With images.',
    );
    expect(markdown).toContain('### Schema\n\n```json');
    // Only the variation whose schema differs gets its own section.
    expect(markdown).not.toContain('### Schema for `default`');
    expect(markdown).toContain('### Schema for `summary`');
  });

  it('notes restricted blocks and schema errors', () => {
    const markdown = blockToMarkdown({
      id: 'broken',
      title: 'Broken',
      kind: 'block',
      docs: '',
      schema: null,
      error: 'x',
      restricted: true,
    });
    expect(markdown).toContain('_Not offered in the block chooser._');
    expect(markdown).toContain(
      '### Schema\n\n_The schema for this block could not be resolved._',
    );
  });

  it('puts the document format before the blocks', () => {
    const markdown = blocksToMarkdown(
      [
        {
          id: 'video',
          title: 'Video',
          kind: 'block',
          docs: 'Embeds a video.',
          schema: null,
        },
      ],
      'The page document.',
    );
    expect(markdown).toMatch(
      /^# Blocks\n\n.+\n\n## Document format\n\nThe page document\.\n\n## Video \(`video`\)\n\n_A Plone block: .+_\n\nEmbeds a video\.\n$/,
    );
    expect(blocksToMarkdown([])).not.toContain('Document format');
  });
});
