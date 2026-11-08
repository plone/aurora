import { describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  createPlateEditor,
  Plate,
  PlateContent,
  useEditorRef,
} from 'platejs/react';

import { PlateEditor } from '../..';
import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { handleAccordionKeyDown } from './accordion-editor-plugin';
import { AccordionKit } from './accordion-kit';
import { getAnchorPlaceholder, isAnchorTaken, slugify } from './anchor';
import {
  getSettingsEntry,
  getSettingsTarget,
  reorderPanel,
  setSettingsTarget,
} from './editor-transforms';

vi.mock('sonner', () => ({ toast: vi.fn(), Toaster: () => null }));

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const panel = (id: string, title: string, extra: object = {}) => ({
  type: 'accordion_panel',
  id,
  startOpen: false,
  anchor: '',
  ...extra,
  children: [
    { type: 'accordion_panel_title', children: [{ text: title }] },
    { type: 'accordion_panel_content', children: [p(`${title} body`)] },
  ],
});
const accordion = (...panels: object[]) => ({
  type: 'accordion',
  id: 'acc',
  exclusive: true,
  theme: 'white',
  children: panels,
});

const plugins = [...BaseBasicBlocksKit, ...AccordionKit];
const createEditor = (value: object[]) =>
  createPlateEditor({ plugins, value: structuredClone(value) as any });

const titles = (editor: any) =>
  editor.children[0].children.map(
    (item: any) => item.children[0].children[0].text,
  );

const escape = { key: 'Escape', preventDefault: () => {} } as any;

describe('panel anchors', () => {
  it('makes slugs', () => {
    expect(slugify('Opening hours')).toBe('opening-hours');
    expect(slugify('  Café & Bar! ')).toBe('cafe-bar');
  });

  it('suggests the title slug, or panel-<n>', () => {
    expect(getAnchorPlaceholder('How to find us', 1)).toBe('how-to-find-us');
    expect(getAnchorPlaceholder('', 2)).toBe('panel-3');
  });

  it('knows when another panel uses an anchor', () => {
    const editor = createEditor([
      accordion(panel('a', 'A', { anchor: 'hours' }), panel('b', 'B')),
    ]);
    expect(isAnchorTaken(editor, 'b', 'hours')).toBe(true);
    expect(isAnchorTaken(editor, 'a', 'hours')).toBe(false);
    expect(isAnchorTaken(editor, 'b', '')).toBe(false);
  });
});

describe('settings target', () => {
  it('moves a panel to another position', () => {
    const editor = createEditor([
      accordion(panel('a', 'A'), panel('b', 'B'), panel('c', 'C')),
    ]);
    reorderPanel(editor, [0], 0, 2);
    expect(titles(editor)).toEqual(['B', 'C', 'A']);
  });

  it('shows the settings of the panel whose title holds the caret', () => {
    const editor = createEditor([accordion(panel('a', 'A'), panel('b', 'B'))]);
    editor.tf.select(editor.api.start([0, 1, 0]));
    expect((getSettingsEntry(editor)?.[0] as any).id).toBe('b');

    editor.tf.select(editor.api.start([0, 1, 1, 0]));
    expect(getSettingsEntry(editor)).toBeUndefined();
  });

  it('selects the level above with Esc', () => {
    const editor = createEditor([accordion(panel('a', 'A'))]);
    editor.tf.select(editor.api.start([0, 0, 0]));

    expect(handleAccordionKeyDown(editor, escape)).toBe(true);
    expect(getSettingsTarget(editor)).toEqual({ type: 'accordion', id: 'acc' });

    expect(handleAccordionKeyDown(editor, escape)).toBe(true);
    expect(getSettingsTarget(editor)).toBeNull();

    setSettingsTarget(editor, { type: 'accordion_panel', id: 'a' });
    expect(handleAccordionKeyDown(editor, escape)).toBe(true);
    expect(getSettingsTarget(editor)).toEqual({ type: 'accordion', id: 'acc' });
  });

  it('leaves Esc to the editor in a block of a panel', () => {
    const editor = createEditor([accordion(panel('a', 'A'))]);
    editor.tf.select(editor.api.start([0, 0, 1, 0]));
    expect(handleAccordionKeyDown(editor, escape)).toBe(false);
  });
});

describe('settings in a popover', () => {
  const renderEditor = (value: object[]) => {
    const editor = createEditor(value);
    editor.tf.select(editor.api.start([0, 0, 0]));
    render(
      <Plate editor={editor}>
        <PlateContent />
      </Plate>,
    );
    return editor;
  };

  it('edits the accordion settings', () => {
    const editor = renderEditor([
      accordion(panel('a', 'Hours'), panel('b', 'Prices')),
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Accordion settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Accordion settings' });

    expect(within(dialog).getByText('2 panels')).toBeInTheDocument();
    const rows = within(dialog).getAllByRole('row');
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('1. Hours'),
      expect.stringContaining('2. Prices'),
    ]);

    fireEvent.click(
      within(dialog).getByRole('checkbox', {
        name: 'Only one panel open at a time',
      }),
    );
    expect((editor.children[0] as any).exclusive).toBe(false);

    fireEvent.click(within(dialog).getByRole('radio', { name: 'Grey' }));
    expect((editor.children[0] as any).theme).toBe('grey');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Add panel' }));
    expect(titles(editor)).toEqual(['Hours', 'Prices', '']);
  });

  it('edits the panel settings', async () => {
    const editor = renderEditor([
      accordion(panel('a', 'Hours'), panel('b', 'Prices', { anchor: 'taken' })),
    ]);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Panel settings' })[0],
    );
    const dialog = screen.getByRole('dialog', { name: 'Panel settings' });
    expect(
      within(dialog).getByText('Panel 1 of 2 · 1 block'),
    ).toBeInTheDocument();

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Opening hours' },
    });
    expect(titles(editor)).toEqual(['Opening hours', 'Prices']);

    fireEvent.click(
      within(dialog).getByRole('checkbox', {
        name: 'Open when the page loads',
      }),
    );
    expect((editor.children[0] as any).children[0].startOpen).toBe(true);

    const anchor = within(dialog).getByRole('textbox', { name: 'Link anchor' });

    // Slate reports changes in a microtask: the form updates right after.
    await waitFor(() =>
      expect(anchor).toHaveAttribute('placeholder', 'opening-hours'),
    );
    fireEvent.change(anchor, { target: { value: 'Our Hours' } });
    fireEvent.blur(anchor);
    expect((editor.children[0] as any).children[0].anchor).toBe('our-hours');
    expect(within(dialog).queryByRole('alert')).toBeNull();

    fireEvent.change(anchor, { target: { value: 'taken' } });
    fireEvent.blur(anchor);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Another panel already uses this anchor.',
    );
    expect(anchor).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('settings in the host sidebar', () => {
  it('renders the settings in the settings container', async () => {
    const sidebar = document.createElement('aside');
    document.body.appendChild(sidebar);
    let editorRef: any;

    render(
      <PlateEditor
        editorConfig={{ plugins }}
        value={[accordion(panel('a', 'Hours'), panel('b', 'Prices'))] as any}
        settingsContainer={() => sidebar}
        onChange={() => {}}
      >
        <Capture onEditor={(editor) => (editorRef = editor)} />
      </PlateEditor>,
    );

    // Slate reports changes in a microtask.
    await act(async () => {
      editorRef.tf.select(editorRef.api.start([0, 1, 0]));
    });

    expect(
      within(sidebar).getByRole('heading', { name: 'Panel' }),
    ).toBeVisible();
    expect(within(sidebar).getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Prices',
    );

    // The settings buttons choose what the sidebar shows; there's no popover.
    fireEvent.click(screen.getByRole('button', { name: 'Accordion settings' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      await within(sidebar).findByRole('heading', { name: 'Accordion' }),
    ).toBeVisible();

    sidebar.remove();
  });
});

function Capture({ onEditor }: { onEditor: (editor: any) => void }) {
  onEditor(useEditorRef());
  return null;
}
