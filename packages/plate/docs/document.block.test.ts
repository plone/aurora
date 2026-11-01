import { describe, expect, it } from 'vitest';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { MAIN_REGION, PLATE_TYPE } from '../constants';
import { TITLE_BLOCK_TYPE } from '../components/editor/plugins/title-renderer';
import markdown from './document.block.md?raw';

describe('document format docs', () => {
  it('documents the plone.plate document model', () => {
    expect(markdown).toMatch(/^---\ndocument_model: plone\.plate\n---\n/);
  });

  it('has examples that are valid JSON and use the real node types', () => {
    const examples = [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map(
      ([, json]) => JSON.parse(json),
    );

    const [document, block] = examples;
    expect(document.blocks[MAIN_REGION]['@type']).toBe(PLATE_TYPE);
    expect(Object.keys(document)).toEqual(['blocks']);
    expect(document.blocks[MAIN_REGION].value[0].type).toBe(TITLE_BLOCK_TYPE);
    expect(block.type).toBe(PLONE_BLOCK_TYPE);
  });
});
