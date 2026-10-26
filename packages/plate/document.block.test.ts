import { describe, expect, it } from 'vitest';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { SOMERSAULT_KEY } from './constants';
import { TITLE_BLOCK_TYPE } from './components/editor/plugins/title-renderer';
import markdown from './document.block.md?raw';

describe('document format docs', () => {
  it('documents the somersault block', () => {
    expect(markdown).toMatch(
      new RegExp(`^---\\nblock: ${SOMERSAULT_KEY}\\n---\\n`),
    );
  });

  it('has examples that are valid JSON and use the real node types', () => {
    const examples = [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map(
      ([, json]) => JSON.parse(json),
    );

    const [document, block] = examples;
    expect(document.blocks[SOMERSAULT_KEY]['@type']).toBe(SOMERSAULT_KEY);
    expect(document.blocks_layout.items).toEqual([SOMERSAULT_KEY]);
    expect(document.blocks[SOMERSAULT_KEY].value[0].type).toBe(
      TITLE_BLOCK_TYPE,
    );
    expect(block.type).toBe(PLONE_BLOCK_TYPE);
  });
});
