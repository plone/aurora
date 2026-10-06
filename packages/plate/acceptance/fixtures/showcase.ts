import { EDITORIAL_MARKS, INLINE_MARKS } from './inline-marks.ts';
import { nativeBlockSections } from './native-blocks.ts';

/**
 * Every native block, mark and inline element of Aurora's somersault presets
 * in one Plate value, after the title block. It's built from the same
 * fixtures as the acceptance and visual tests, so it covers what they cover.
 */
export function showcaseValue(title: string) {
  return [
    { type: 'title', children: [{ text: title }] },
    ...Object.values(nativeBlockSections).flat(),
    ...INLINE_MARKS,
    ...EDITORIAL_MARKS,
  ];
}
