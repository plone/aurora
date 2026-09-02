import { describe, expect, it } from 'vitest';
import { KEYS, createSlateEditor } from 'platejs';
import type { SlateEditor, Value } from 'platejs';

import {
  LegacyPastePlugin,
  normalizeLegacyFragment,
} from './legacy-paste-plugin';

const makeEditor = (value: Value): SlateEditor =>
  createSlateEditor({
    plugins: [LegacyPastePlugin],
    value,
  });

describe('normalizeLegacyFragment', () => {
  it('migrates legacy marks, links, and lists in a single pass', () => {
    const editor = makeEditor([{ type: 'p', children: [{ text: '' }] }]);

    const fragment: Value = [
      {
        type: 'p',
        children: [
          { type: 'strong', children: [{ text: 'bold' }] },
          { type: 'em', children: [{ text: 'italic' }] },
          { type: 'del', children: [{ text: 'strike' }] },
          {
            type: 'link',
            data: { url: 'https://example.com', target: '_blank' },
            children: [{ text: 'link' }],
          },
        ],
      } as any,
      {
        type: 'ul',
        children: [
          { type: 'li', children: [{ text: 'first' }] },
          { type: 'li', children: [{ text: 'second' }] },
        ],
      } as any,
    ];

    const result = normalizeLegacyFragment(editor, fragment);

    expect(result).toEqual([
      {
        type: 'p',
        children: [
          { text: 'bold', bold: true },
          { text: 'italic', italic: true },
          { text: 'strike', strikethrough: true },
          {
            type: KEYS.link,
            url: 'https://example.com',
            target: '_blank',
            children: [{ text: 'link' }],
          },
        ],
      },
      {
        type: KEYS.p,
        children: [{ text: 'first' }],
        indent: 1,
        listStyleType: KEYS.ul,
      },
      {
        type: KEYS.p,
        children: [{ text: 'second' }],
        indent: 1,
        listStyleType: KEYS.ul,
        listStart: 2,
      },
    ]);
  });

  it('is a no-op for already-normalized (native Plate) fragments', () => {
    const editor = makeEditor([{ type: 'p', children: [{ text: '' }] }]);

    const fragment: Value = [
      {
        type: 'p',
        children: [
          { text: 'bold', bold: true },
          {
            type: KEYS.link,
            url: 'https://example.com',
            children: [{ text: 'x' }],
          },
        ],
      } as any,
    ];

    const result = normalizeLegacyFragment(
      editor,
      // clone so we compare against the original shape
      JSON.parse(JSON.stringify(fragment)),
    );

    expect(result).toEqual(fragment);
  });

  it('does not mutate the input fragment', () => {
    const editor = makeEditor([{ type: 'p', children: [{ text: '' }] }]);
    const fragment: Value = [
      { type: 'strong', children: [{ text: 'bold' }] } as any,
    ];
    const snapshot = JSON.parse(JSON.stringify(fragment));

    normalizeLegacyFragment(editor, fragment);

    expect(fragment).toEqual(snapshot);
  });
});

describe('LegacyPastePlugin insertFragment override', () => {
  it('normalizes a pasted legacy fragment at the insertFragment boundary', () => {
    const editor = makeEditor([{ type: 'p', children: [{ text: '' }] }]);

    editor.tf.select({ path: [0, 0], offset: 0 });
    editor.tf.insertFragment([
      { type: 'strong', children: [{ text: 'bold' }] },
    ] as any);

    // The inserted text carries the bold mark, not a legacy `strong` element.
    const marks = editor.api.marks();
    expect(marks?.bold).toBe(true);
    expect(JSON.stringify(editor.children)).not.toContain('"strong"');
  });

  it('inserts native Plate fragments unchanged', () => {
    const editor = makeEditor([{ type: 'p', children: [{ text: '' }] }]);

    editor.tf.select({ path: [0, 0], offset: 0 });
    editor.tf.insertFragment([{ text: 'hello', bold: true }] as any);

    const marks = editor.api.marks();
    expect(marks?.bold).toBe(true);
  });
});
