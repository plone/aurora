import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import type { ConfigType } from '@plone/registry';
import install from '.';

// The *.block.md files of the blocks, which the build collects for the
// @blocks-schema endpoint.
const root = path.dirname(fileURLToPath(import.meta.url));
const files = Object.fromEntries(
  fs
    .readdirSync(root, { recursive: true, encoding: 'utf-8' })
    .filter(
      (file) => file.endsWith('.block.md') && !file.includes('node_modules'),
    )
    .map((file) => [file, fs.readFileSync(path.join(root, file), 'utf-8')]),
);

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

const blocksConfig = install({
  blocks: { blocksConfig: {} },
  registerUtility: vi.fn(),
} as unknown as ConfigType).blocks.blocksConfig;

const docs = Object.entries(files).map(([path, markdown]) => {
  const [, frontmatter = ''] = markdown.match(FRONTMATTER) ?? [];
  const block = frontmatter.match(/^block:\s*(\S+)$/m)?.[1];
  return { path, block, markdown: markdown.replace(FRONTMATTER, '').trim() };
});

describe('block docs', () => {
  it('documents every block', () => {
    expect(docs.map((file) => file.block).sort()).toEqual(
      Object.keys(blocksConfig).sort(),
    );
  });

  it.each(docs.map((file) => [file.path, file]))(
    '%s has examples that are valid block data',
    (_path, { block, markdown }) => {
      expect(block).toBeDefined();
      expect(markdown).not.toBe('');

      const examples = [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)];
      expect(examples.length).toBeGreaterThan(0);
      for (const [, json] of examples) {
        expect(JSON.parse(json)['@type']).toBe(block);
      }
    },
  );

  it('only uses placeholders the configuration has', () => {
    for (const { block, markdown } of docs) {
      for (const [, key] of markdown.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
        expect(blocksConfig[block as string]).toHaveProperty(key);
      }
    }
  });
});
