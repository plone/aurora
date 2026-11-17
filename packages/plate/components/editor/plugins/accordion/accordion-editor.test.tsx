import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Plate, PlateContent, createPlateEditor } from 'platejs/react';

import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { getDefaultSlashMenuGroups } from '../slash-menu';
import { handleAccordionKeyDown } from './accordion-editor-plugin';
import { AccordionKit } from './accordion-kit';
import {
  enterPanel,
  insertAccordion,
  insertAccordionPanel,
  isPanelOpen,
  setAllPanelsOpen,
  setPanelOpen,
} from './editor-transforms';

const p = (text: string, extra: object = {}) => ({
  type: 'p',
  children: [{ text }],
  ...extra,
});
const panel = (id: string, title: string, ...blocks: object[]) => ({
  type: 'accordion_panel',
  id,
  startOpen: false,
  anchor: '',
  children: [
    { type: 'accordion_panel_title', children: [{ text: title }] },
    {
      type: 'accordion_panel_content',
      children: blocks.length ? blocks : [p('')],
    },
  ],
});
const accordion = (...panels: object[]) => ({
  type: 'accordion',
  id: 'acc',
  exclusive: true,
  theme: 'white',
  children: panels,
});

const createEditor = (value: object[]) =>
  createPlateEditor({
    plugins: [...BaseBasicBlocksKit, ...AccordionKit],
    value: structuredClone(value) as any,
  });

const key = (name: string) => {
  let prevented = false;
  return {
    event: {
      key: name,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {
        prevented = true;
      },
    },
    prevented: () => prevented,
  };
};

describe('accordion editing operations', () => {
  it('opens and closes panels in the editor only, never in the value', () => {
    const editor = createEditor([accordion(panel('a', 'A'), panel('b', 'B'))]);
    const before = structuredClone(editor.children);

    expect(isPanelOpen(editor, 'a')).toBe(true);
    setPanelOpen(editor, [0, 0], false);
    expect(isPanelOpen(editor, 'a')).toBe(false);
    expect(isPanelOpen(editor, 'b')).toBe(true);
    expect(editor.children).toEqual(before);

    setPanelOpen(editor, [0, 0], true);
    expect(isPanelOpen(editor, 'a')).toBe(true);
  });

  it('opens and closes every panel', () => {
    const editor = createEditor([accordion(panel('a', 'A'), panel('b', 'B'))]);

    setAllPanelsOpen(editor, [0], false);
    expect([isPanelOpen(editor, 'a'), isPanelOpen(editor, 'b')]).toEqual([
      false,
      false,
    ]);
    setAllPanelsOpen(editor, [0], true);
    expect([isPanelOpen(editor, 'a'), isPanelOpen(editor, 'b')]).toEqual([
      true,
      true,
    ]);
  });

  it('moves the selection to the title of a panel it closes', () => {
    const editor = createEditor([accordion(panel('a', 'Title', p('Body')))]);
    editor.tf.select(editor.api.start([0, 0, 1, 0]));

    setPanelOpen(editor, [0, 0], false);

    expect(editor.selection?.anchor).toEqual(editor.api.end([0, 0, 0]));
  });

  it('keeps the selection when it closes another panel', () => {
    const editor = createEditor([
      accordion(panel('a', 'A', p('One')), panel('b', 'B', p('Two'))),
    ]);
    editor.tf.select(editor.api.start([0, 1, 1, 0]));

    setPanelOpen(editor, [0, 0], false);

    expect(editor.selection?.anchor.path).toEqual([0, 1, 1, 0, 0]);
  });

  it('inserts an open panel and puts the caret in its title', () => {
    const editor = createEditor([accordion(panel('a', 'A'), panel('b', 'B'))]);

    insertAccordionPanel(editor, [0], 1);

    const inserted = (editor.children[0] as any).children[1];
    expect(inserted).toMatchObject({
      type: 'accordion_panel',
      startOpen: false,
      anchor: '',
      children: [
        { type: 'accordion_panel_title', children: [{ text: '' }] },
        { type: 'accordion_panel_content', children: [p('')] },
      ],
    });
    expect(isPanelOpen(editor, inserted.id)).toBe(true);
    expect(editor.selection?.anchor.path).toEqual([0, 1, 0, 0]);
  });

  it('inserts an accordion after the current block', () => {
    const editor = createEditor([p('Before'), p('After')]);
    editor.tf.select(editor.api.start([0]));

    insertAccordion(editor);

    expect((editor.children as any[]).map((node) => node.type)).toEqual([
      'p',
      'accordion',
      'p',
    ]);
    expect(editor.selection?.anchor.path).toEqual([1, 0, 0, 0]);
  });

  it('opens a panel and moves into its first block', () => {
    const editor = createEditor([accordion(panel('a', 'A', p('First')))]);
    setPanelOpen(editor, [0, 0], false);

    enterPanel(editor, [0, 0]);

    expect(isPanelOpen(editor, 'a')).toBe(true);
    expect(editor.selection?.anchor).toEqual(editor.api.start([0, 0, 1, 0]));
  });
});

describe('accordion keyboard', () => {
  it('moves from a title into the panel on Enter', () => {
    const editor = createEditor([accordion(panel('a', 'Title', p('Body')))]);
    editor.tf.select(editor.api.end([0, 0, 0]));
    const { event, prevented } = key('Enter');

    expect(handleAccordionKeyDown(editor, event)).toBe(true);
    expect(prevented()).toBe(true);
    expect(editor.selection?.anchor).toEqual(editor.api.start([0, 0, 1, 0]));
  });

  it('never merges a title with what comes before or after it', () => {
    const editor = createEditor([
      accordion(panel('a', 'A', p('One')), panel('b', 'B')),
    ]);

    editor.tf.select(editor.api.start([0, 1, 0]));
    const backspace = key('Backspace');
    expect(handleAccordionKeyDown(editor, backspace.event)).toBe(true);
    expect(backspace.prevented()).toBe(true);

    editor.tf.select(editor.api.end([0, 0, 0]));
    const del = key('Delete');
    expect(handleAccordionKeyDown(editor, del.event)).toBe(true);
    expect(del.prevented()).toBe(true);

    // Inside the title, the keys work as usual.
    editor.tf.select({ path: [0, 0, 0, 0], offset: 1 });
    expect(handleAccordionKeyDown(editor, key('Backspace').event)).toBe(false);
  });

  it('moves to the title on Backspace at the start of the first block', () => {
    const editor = createEditor([accordion(panel('a', 'Title', p('Body')))]);
    editor.tf.select(editor.api.start([0, 0, 1, 0]));
    const { event, prevented } = key('Backspace');

    expect(handleAccordionKeyDown(editor, event)).toBe(true);
    expect(prevented()).toBe(true);
    expect(editor.selection?.anchor).toEqual(editor.api.end([0, 0, 0]));
  });

  it('lets a list item at the start of a panel outdent as usual', () => {
    const editor = createEditor([
      accordion(
        panel('a', 'Title', p('Item', { indent: 1, listStyleType: 'disc' })),
      ),
    ]);
    editor.tf.select(editor.api.start([0, 0, 1, 0]));

    expect(handleAccordionKeyDown(editor, key('Backspace').event)).toBe(false);
  });

  it('does nothing on Delete at the end of the last block of a panel', () => {
    const editor = createEditor([
      accordion(panel('a', 'A', p('One'), p('Two')), panel('b', 'B')),
    ]);

    editor.tf.select(editor.api.end([0, 0, 1, 1]));
    const { event, prevented } = key('Delete');
    expect(handleAccordionKeyDown(editor, event)).toBe(true);
    expect(prevented()).toBe(true);

    // Between blocks of a panel, Delete merges them as usual.
    editor.tf.select(editor.api.end([0, 0, 1, 0]));
    expect(handleAccordionKeyDown(editor, key('Delete').event)).toBe(false);
  });
});

describe('accordion slash menu item', () => {
  const items = (editor: any, container?: { type: string }) =>
    getDefaultSlashMenuGroups(editor, { hasTitleBlock: true, container })
      .flatMap((group) => group.items)
      .map((item) => item.value);

  it('offers the accordion in editors that have it', () => {
    expect(items(createEditor([p('')]))).toContain('accordion');
  });

  it('does not offer the accordion inside an accordion', () => {
    expect(items(createEditor([p('')]), { type: 'accordion' })).not.toContain(
      'accordion',
    );
  });

  it('does not offer the accordion in editors that lack it', () => {
    const editor = createPlateEditor({ plugins: BaseBasicBlocksKit });
    expect(items(editor)).not.toContain('accordion');
  });
});

describe('accordion editor view', () => {
  const renderEditor = (value: object[]) => {
    const editor = createEditor(value);
    const utils = render(
      <Plate editor={editor}>
        <PlateContent />
      </Plate>,
    );
    return { editor, ...utils };
  };

  it('opens and closes a panel from its chevron', () => {
    const { container } = renderEditor([
      accordion(panel('a', 'Opening hours', p('One'), p('Two'))),
    ]);

    const chevron = screen.getByRole('button', {
      name: 'Collapse Opening hours',
    });
    expect(chevron).toHaveAttribute('aria-expanded', 'true');
    const content = container.querySelector('.block-accordion__content');
    expect(chevron).toHaveAttribute('aria-controls', content!.id);
    expect(content).not.toHaveAttribute('hidden');

    fireEvent.click(chevron);

    const expand = screen.getByRole('button', { name: 'Expand Opening hours' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    expect(content).toHaveAttribute('hidden');
    expect(screen.getByText('2 blocks')).toBeInTheDocument();
  });

  it('shows a placeholder and a label for an untitled panel', () => {
    renderEditor([accordion(panel('a', ''))]);

    expect(screen.getByText('Untitled panel')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Collapse untitled panel' }),
    ).toBeInTheDocument();
  });

  it('shows the panel controls only while the selection is in the accordion', () => {
    const value = [accordion(panel('a', 'A'), panel('b', 'B')), p('After')];
    const outside = renderEditor(value);
    expect(screen.queryByRole('button', { name: 'Expand all' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Add a panel at the end' }),
    ).toBeNull();
    outside.unmount();

    const editor = createEditor(value);
    editor.tf.select(editor.api.start([0, 0, 0]));
    render(
      <Plate editor={editor}>
        <PlateContent />
      </Plate>,
    );

    expect(screen.getByRole('button', { name: 'Expand all' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Collapse all' })).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Insert a panel between panel 1 and 2',
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Add a panel at the end' }),
    );
    expect((editor.children[0] as any).children).toHaveLength(3);
    expect(editor.selection?.anchor.path).toEqual([0, 2, 0, 0]);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(isPanelOpen(editor, 'a')).toBe(false);
    expect(isPanelOpen(editor, 'b')).toBe(false);
  });

  it('renders panel titles as headings', () => {
    renderEditor([accordion(panel('a', 'Contact'))]);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Contact',
    );
  });
});
