import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createPlateEditor } from 'platejs/react';
import somersaultEditor from '../config/presets/somersault-editor';
import { BaseLinkKit } from '../components/editor/plugins/link-base-kit';

// The docs of the native elements of the page document, which the build
// collects for the @blocks-schema endpoint.
const root = path.dirname(fileURLToPath(import.meta.url));
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

const files = fs
  .readdirSync(root)
  .filter((file) => file.endsWith('.block.md'))
  .map((file) => {
    const markdown = fs.readFileSync(path.join(root, file), 'utf-8');
    const frontmatter = markdown.match(FRONTMATTER)?.[1] ?? '';
    const field = (key: string) =>
      frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim();
    return {
      file,
      elements: field('element')?.split(/\s*,\s*/) ?? [],
      title: field('title'),
      documentModel: field('document_model'),
      examples: [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map(
        ([, json]) => JSON.parse(json),
      ),
    };
  })
  .filter(({ elements }) => elements.length > 0);

const withoutBlockWidth = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value), (key, item) =>
    key === 'blockWidth' ? undefined : item,
  );

describe('element docs', () => {
  it('documents the elements of the editor', () => {
    expect(files.flatMap(({ elements }) => elements).sort()).toEqual(
      [
        'blockquote',
        'callout',
        'code_block',
        'column_group',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'p',
        'table',
        'title',
        'toc',
        'toggle',
      ].sort(),
    );
  });

  it('only documents elements that the editor has', () => {
    const editor = createPlateEditor({
      plugins: somersaultEditor.plugins as any,
    });
    for (const element of files.flatMap(({ elements }) => elements)) {
      expect(editor.plugins[element], element).toBeDefined();
    }
  });

  it.each(files.map((file) => [file.file, file]))(
    '%s names the plone.plate document model',
    (_file, { documentModel }) => {
      expect(documentModel).toBe('plone.plate');
    },
  );

  it.each(files.map((file) => [file.file, file]))(
    '%s has a title and an example of its element',
    (_file, { elements, title, examples }) => {
      expect(title).toBeTruthy();
      expect(examples.length).toBeGreaterThan(0);
      expect(elements).toContain(examples[0].type);
    },
  );

  it.each(files.map((file) => [file.file, file]))(
    '%s has examples that the editor keeps as they are',
    (_file, { examples }) => {
      const value = [
        { type: 'title', children: [{ text: 'Page' }] },
        ...examples.filter((node) => node.type !== 'title'),
      ];
      const editor = createPlateEditor({
        // The CMS UI adds the links to the editor of the page.
        plugins: [...(somersaultEditor.plugins ?? []), ...BaseLinkKit] as any,
        value: structuredClone(value),
      });
      editor.tf.normalize({ force: true });

      // The editor ends the document with an empty paragraph, unless it
      // already ends with a paragraph.
      const children = withoutBlockWidth(editor.children) as unknown[];
      const trailing = { type: 'p', children: [{ text: '' }] };
      if (value.at(-1)?.type !== 'p') {
        expect(children.at(-1)).toEqual(trailing);
        children.pop();
      }
      expect(children).toEqual(value);
    },
  );
});
