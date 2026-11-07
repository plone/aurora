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

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { toast } from 'sonner';
import { PlateEditor } from '../..';
import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import {
  handleAccordionBlockSelectionKeyDown,
  handleAccordionKeyDown,
} from './accordion-editor-plugin';
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

const block = (id: string, text: string) => ({
  type: 'p',
  id,
  children: [{ text }],
});
const panelWithBlocks = (id: string, title: string, ...blocks: object[]) => ({
  type: 'accordion_panel',
  id,
  startOpen: false,
  anchor: '',
  children: [
    { type: 'accordion_panel_title', children: [{ text: title }] },
    { type: 'accordion_panel_content', children: blocks },
  ],
});
const createSelectableEditor = (value: object[]) =>
  createPlateEditor({
    plugins: [...plugins, BlockSelectionPlugin],
    value: structuredClone(value) as any,
  });
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
    expect(getSettingsTarget(editor)).toEqual({ type: 'page' });

    expect(handleAccordionKeyDown(editor, escape)).toBe(true);
    expect(getSettingsTarget(editor)).toBeNull();

    setSettingsTarget(editor, { type: 'accordion_panel', id: 'a' });
    expect(handleAccordionKeyDown(editor, escape)).toBe(true);
    expect(getSettingsTarget(editor)).toEqual({ type: 'accordion', id: 'acc' });
  });

  it('selects the panel with Esc from a block, without block selection', () => {
    const editor = createEditor([accordion(panel('a', 'A'))]);
    editor.tf.select(editor.api.start([0, 0, 1, 0]));

    expect(handleAccordionKeyDown(editor, escape)).toBe(true);
    expect(getSettingsTarget(editor)).toEqual({
      type: 'accordion_panel',
      id: 'a',
    });
  });

  it('selects a block, then its panel, with Esc', () => {
    const editor = createSelectableEditor([
      accordion(panelWithBlocks('a', 'A', block('one', 'One'))),
      block('after', 'After'),
    ]);
    editor.tf.select(editor.api.start([0, 0, 1, 0]));
    const blockSelection = (editor.getApi(BlockSelectionPlugin) as any)
      .blockSelection;

    // Only the block, not the whole accordion.
    expect(handleAccordionKeyDown(editor, escape)).toBe(true);
    expect(blockSelection.getNodes().map(([node]: any) => node.id)).toEqual([
      'one',
    ]);

    expect(handleAccordionBlockSelectionKeyDown(editor, escape)).toBe(true);
    expect(blockSelection.getNodes()).toHaveLength(0);
    expect(getSettingsTarget(editor)).toEqual({
      type: 'accordion_panel',
      id: 'a',
    });
    expect(editor.selection?.anchor).toEqual(editor.api.end([0, 0, 0]));
  });

  it('deletes a selected block with Delete, with an Undo notification', () => {
    const editor = createSelectableEditor([
      accordion(
        panelWithBlocks('a', 'A', block('one', 'One'), block('two', 'Two')),
      ),
    ]);
    const blockSelection = (editor.getApi(BlockSelectionPlugin) as any)
      .blockSelection;
    blockSelection.set('one');

    expect(
      handleAccordionBlockSelectionKeyDown(editor, {
        key: 'Delete',
        preventDefault: () => {},
      }),
    ).toBe(true);

    expect(
      (editor.children[0] as any).children[0].children[1].children,
    ).toHaveLength(1);
    expect(toast).toHaveBeenCalledWith(
      'Text block deleted',
      expect.objectContaining({ action: expect.anything() }),
    );
  });

  it('leaves a selection of several blocks to the editor', () => {
    const editor = createSelectableEditor([
      accordion(panelWithBlocks('a', 'A', block('one', 'One'))),
      block('after', 'After'),
    ]);
    const blockSelection = (editor.getApi(BlockSelectionPlugin) as any)
      .blockSelection;
    blockSelection.set(['one', 'after']);

    expect(handleAccordionBlockSelectionKeyDown(editor, escape)).toBe(false);
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

  it('takes Tab through the sidebar between the accordion and the text after it', async () => {
    const sidebar = document.createElement('aside');
    document.body.appendChild(sidebar);
    let editorRef: any;

    render(
      <PlateEditor
        editorConfig={{ plugins }}
        value={
          [
            accordion(panel('a', 'Hours'), panel('b', 'Prices')),
            p('After'),
          ] as any
        }
        settingsContainer={() => sidebar}
        onChange={() => {}}
      >
        <Capture onEditor={(editor) => (editorRef = editor)} />
      </PlateEditor>,
    );
    await act(async () => {
      editorRef.tf.select(editorRef.api.start([0, 1, 0]));
    });

    // From the accordion's last control to the sidebar's first.
    const addPanel = screen.getByRole('button', {
      name: 'Add a panel at the end',
    });
    fireEvent.keyDown(addPanel, { key: 'Tab' });
    const controls = Array.from(
      sidebar.querySelectorAll<HTMLElement>('button, input'),
    ).filter((element) => !(element as HTMLButtonElement).disabled);
    expect(document.activeElement).toBe(controls[0]);

    // Shift+Tab from the sidebar's first control goes back.
    fireEvent.keyDown(controls[0], { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(addPanel);

    // Tab from the sidebar's last control goes to the text after the
    // accordion.
    await act(async () => {
      fireEvent.keyDown(controls.at(-1)!, { key: 'Tab' });
    });
    expect(editorRef.selection.anchor).toEqual(editorRef.api.start([1]));

    sidebar.remove();
  });
});

describe('the levels around the panel settings in the host sidebar', () => {
  const renderInSidebar = async (select: (editor: any) => void) => {
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
    await act(async () => select(editorRef));
    return { sidebar, editor: editorRef };
  };

  it('shows the place and the actions of a text block', async () => {
    const { sidebar, editor } = await renderInSidebar((ed) =>
      ed.tf.select(ed.api.start([0, 0, 1, 0])),
    );

    const crumbs = within(sidebar).getByRole('navigation', {
      name: 'Selection',
    });
    expect(within(crumbs).getByRole('button', { name: 'Page' })).toBeVisible();
    expect(within(crumbs).getByText('Text')).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      within(sidebar).getByText('Block 1 of 1 in “Hours”'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole('button', { name: 'Move up' }),
    ).toBeDisabled();

    await act(async () => {
      fireEvent.click(within(sidebar).getByRole('button', { name: 'Delete' }));
    });
    // The panel keeps an empty text block.
    expect(editor.children[0].children[0].children[1].children).toEqual([
      expect.objectContaining({ type: 'p', children: [{ text: '' }] }),
    ]);

    sidebar.remove();
  });

  it('shows the block the user moves to, even inside the chosen panel', async () => {
    const { sidebar, editor } = await renderInSidebar((ed) =>
      ed.tf.select(ed.api.start([0, 0, 0])),
    );
    // As Esc from a block of the panel does.
    await act(async () =>
      setSettingsTarget(editor, { type: 'accordion_panel', id: 'a' }),
    );
    expect(
      within(sidebar).getByRole('heading', { name: 'Panel' }),
    ).toBeVisible();

    await act(async () => editor.tf.select(editor.api.start([0, 0, 1, 0])));

    expect(getSettingsTarget(editor)).toBeNull();
    expect(
      within(sidebar).getByText('Block 1 of 1 in “Hours”'),
    ).toBeInTheDocument();

    sidebar.remove();
  });

  it('shows how to choose a level at the page level', async () => {
    const { sidebar, editor } = await renderInSidebar((ed) =>
      ed.tf.select(ed.api.start([0, 0, 1, 0])),
    );
    // As Esc from the accordion's settings does.
    await act(async () => setSettingsTarget(editor, { type: 'page' }));

    expect(
      within(sidebar).getByText(
        "Click the accordion's frame or its label, a panel header or a block to see its settings here.",
      ),
    ).toBeVisible();
    expect(within(sidebar).queryByText(/^Block \d/)).toBeNull();

    sidebar.remove();
  });
});

function Capture({ onEditor }: { onEditor: (editor: any) => void }) {
  onEditor(useEditorRef());
  return null;
}
