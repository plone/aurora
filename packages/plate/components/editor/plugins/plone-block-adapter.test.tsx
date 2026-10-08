import { render } from '@testing-library/react';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import { describe, expect, it, vi } from 'vitest';

import { PloneBlockAdapterPlugin } from './plone-block-adapter';

vi.mock('@plone/registry', () => ({
  default: {
    blocks: {
      blocksConfig: {
        image: { edit: () => <img alt="Plone block content" /> },
      },
    },
    settings: {},
  },
}));

const value = [
  {
    type: PLONE_BLOCK_TYPE,
    '@type': 'image',
    children: [{ text: '' }],
  },
];

let editorRef: ReturnType<typeof usePlateEditor> | null = null;

function Editor() {
  const editor = usePlateEditor({
    plugins: [PloneBlockAdapterPlugin],
    value,
  });
  editorRef = editor;

  return (
    <Plate editor={editor}>
      <PlateContent />
    </Plate>
  );
}

describe('PloneBlockAdapterElement', () => {
  it('renders the void spacer text so Slate can resolve its DOM node', () => {
    const { container, getByAltText } = render(<Editor />);

    expect(getByAltText('Plone block content')).toBeTruthy();
    expect(container.querySelector('[data-slate-spacer]')).not.toBeNull();

    // Dragging a block calls `setFragmentData`, which resolves the DOM node
    // of the void's text child and throws when it is not rendered.
    const text = (editorRef!.children[0] as any).children[0];
    expect(() => editorRef!.api.toDOMNode(text)).not.toThrow();
  });
});
