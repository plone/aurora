import type { ConfigType } from '@plone/registry';
import type { StyleFieldDefinitionUtility } from '@plone/types';
import { describe, expect, it, vi } from 'vitest';
import install from '.';

describe('blocks configuration', () => {
  it('registers configurable alignment and size definitions', () => {
    const utilities = new Map<string, StyleFieldDefinitionUtility>();
    const config = {
      blocks: {
        blocksConfig: {},
      },
      registerUtility: vi.fn(
        ({
          name,
          method,
        }: {
          name: string;
          method: StyleFieldDefinitionUtility;
        }) => {
          utilities.set(name, method);
        },
      ),
    } as unknown as ConfigType;

    install(config);

    const utilityArgs = {
      data: { '@type': 'image' },
      blockType: 'image',
      fieldName: 'size',
    };

    expect(utilities.get('size')?.(utilityArgs)).toEqual(config.blocks.sizes);
    expect(
      utilities.get('align')?.({ ...utilityArgs, fieldName: 'align' }),
    ).toEqual(config.blocks.alignments);
    expect(config.blocks.sizes?.[2].style).toEqual({
      '--block-size': 'var(--block-size-large, 100%)',
    });
  });
});
