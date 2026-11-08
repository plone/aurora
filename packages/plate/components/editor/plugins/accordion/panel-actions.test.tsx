import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Plate, PlateContent, createPlateEditor } from 'platejs/react';
import { toast } from 'sonner';

import { PlateEditor } from '../..';
import { BaseBasicBlocksKit } from '../basic-blocks-base-kit';
import { handleAccordionKeyDown } from './accordion-editor-plugin';
import { AccordionKit } from './accordion-kit';
import {
  duplicatePanel,
  getSettingsTarget,
  movePanel,
  removePanel,
  setAllPanelsOpen,
} from './editor-transforms';

vi.mock('sonner', () => ({
  toast: vi.fn(),
  Toaster: () => <div data-testid="toaster" />,
}));

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const panel = (id: string, title: string, extra: object = {}) => ({
  type: 'accordion_panel',
  id,
  startOpen: false,
  anchor: '',
  ...extra,
  children: [
    { type: 'accordion_panel_title', children: [{ text: title }] },
    {
      type: 'accordion_panel_content',
      children: [p(`${title} body`)],
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

const titles = (editor: any) =>
  editor.children[0].children.map(
    (item: any) => item.children[0].children[0].text,
  );

const announcer = () => document.querySelector('[data-plate-announcer]');

beforeEach(() => {
  vi.mocked(toast).mockClear();
});

afterEach(() => {
  announcer()?.remove();
});

describe('moving panels', () => {
  it('moves a panel up and down, but not past the ends', async () => {
    const editor = createEditor([
      accordion(panel('a', 'A'), panel('b', 'B'), panel('c', 'C')),
    ]);

    expect(movePanel(editor, [0, 0], -1)).toBe(false);
    expect(movePanel(editor, [0, 2], 1)).toBe(false);

    expect(movePanel(editor, [0, 0], 1)).toBe(true);
    expect(titles(editor)).toEqual(['B', 'A', 'C']);
    await waitFor(() =>
      expect(announcer()).toHaveTextContent('Panel moved to position 2 of 3'),
    );

    editor.undo();
    expect(titles(editor)).toEqual(['A', 'B', 'C']);
  });

  it('moves the panel whose title holds the caret with Alt+Shift+arrows', () => {
    const editor = createEditor([accordion(panel('a', 'A'), panel('b', 'B'))]);
    editor.tf.select(editor.api.start([0, 1, 0]));
    let prevented = false;
    const event = {
      key: 'ArrowUp',
      altKey: true,
      shiftKey: true,
      preventDefault: () => {
        prevented = true;
      },
    };

    expect(handleAccordionKeyDown(editor, event)).toBe(true);
    expect(prevented).toBe(true);
    expect(titles(editor)).toEqual(['B', 'A']);
    // The caret moves with the panel.
    expect(editor.selection?.anchor.path).toEqual([0, 0, 0, 0]);
  });
});

describe('duplicating panels', () => {
  it('inserts a copy after the panel, with new IDs and no anchor', () => {
    const editor = createEditor([
      accordion(
        panel('a', 'Hours', { startOpen: true, anchor: 'hours' }),
        panel('b', 'B'),
      ),
    ]);

    duplicatePanel(editor, [0, 0]);

    const panels = (editor.children[0] as any).children;
    expect(titles(editor)).toEqual(['Hours', 'Hours (copy)', 'B']);
    expect(panels[1]).toMatchObject({
      startOpen: false,
      anchor: '',
      children: [
        { type: 'accordion_panel_title' },
        { type: 'accordion_panel_content', children: [p('Hours body')] },
      ],
    });
    expect(panels[1].id).not.toBe('a');
    expect(editor.selection?.anchor).toEqual(editor.api.end([0, 1, 0]));
  });

  it('keeps an untitled copy untitled', () => {
    const editor = createEditor([accordion(panel('a', ''))]);

    duplicatePanel(editor, [0, 0]);

    expect(titles(editor)).toEqual(['', '']);
  });
});

describe('deleting panels', () => {
  it('does not delete the last panel', () => {
    const editor = createEditor([accordion(panel('a', 'A'))]);

    expect(removePanel(editor, [0, 0])).toBe(false);
    expect(titles(editor)).toEqual(['A']);
    expect(toast).not.toHaveBeenCalled();
  });

  it('deletes a panel and offers to undo it', async () => {
    const editor = createEditor([
      accordion(panel('a', 'A'), panel('b', 'B'), panel('c', 'C')),
    ]);

    expect(removePanel(editor, [0, 1])).toBe(true);
    expect(titles(editor)).toEqual(['A', 'C']);
    // The accordion is selected, with the caret in the panel before.
    expect(getSettingsTarget(editor)).toEqual({
      type: 'accordion',
      id: 'acc',
    });
    expect(editor.selection?.anchor).toEqual(editor.api.end([0, 0, 0]));
    await waitFor(() => expect(announcer()).toHaveTextContent('Panel deleted'));

    expect(toast).toHaveBeenCalledWith('Panel “B” deleted', {
      duration: 8000,
      action: { label: 'Undo', onClick: expect.any(Function) },
    });
    const [, options] = vi.mocked(toast).mock.calls[0] as any;
    options.action.onClick();

    expect(titles(editor)).toEqual(['A', 'B', 'C']);
    await waitFor(() => expect(announcer()).toHaveTextContent('Undone'));
  });
});

describe('expand and collapse all', () => {
  it('announces that every panel opened or closed', async () => {
    const editor = createEditor([accordion(panel('a', 'A'), panel('b', 'B'))]);

    setAllPanelsOpen(editor, [0], false);
    await waitFor(() =>
      expect(announcer()).toHaveTextContent('All panels collapsed'),
    );
    setAllPanelsOpen(editor, [0], true);
    await waitFor(() =>
      expect(announcer()).toHaveTextContent('All panels expanded'),
    );
  });
});

describe('panel actions in the editor', () => {
  it('disables the actions that cannot run', () => {
    const editor = createEditor([accordion(panel('a', 'A'), panel('b', 'B'))]);
    render(
      <Plate editor={editor}>
        <PlateContent />
      </Plate>,
    );

    const moveUp = screen.getAllByRole('button', { name: 'Move panel up' });
    const moveDown = screen.getAllByRole('button', {
      name: 'Move panel down',
    });
    expect(moveUp[0]).toBeDisabled();
    expect(moveUp[1]).toBeEnabled();
    expect(moveDown[0]).toBeEnabled();
    expect(moveDown[1]).toBeDisabled();

    fireEvent.click(moveDown[0]);
    expect(titles(editor)).toEqual(['B', 'A']);
  });

  it('acts on the right panel right after panels move', () => {
    const editor = createEditor([accordion(panel('a', 'A'), panel('b', 'B'))]);
    render(
      <Plate editor={editor}>
        <PlateContent />
      </Plate>,
    );

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Move panel down' })[0],
    );
    expect(titles(editor)).toEqual(['B', 'A']);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Duplicate panel' })[0],
    );
    expect(titles(editor)).toEqual(['B', 'B (copy)', 'A']);
  });

  it('disables Delete on the last panel', () => {
    const editor = createEditor([accordion(panel('a', 'A'))]);
    render(
      <Plate editor={editor}>
        <PlateContent />
      </Plate>,
    );

    expect(screen.getByRole('button', { name: 'Delete panel' })).toBeDisabled();
  });
});

describe('editor toaster', () => {
  const editorConfig = { plugins: [...BaseBasicBlocksKit, ...AccordionKit] };

  it('renders one toaster for several editors', () => {
    render(
      <>
        <PlateEditor editorConfig={editorConfig} onChange={() => {}} />
        <PlateEditor editorConfig={editorConfig} onChange={() => {}} />
      </>,
    );

    expect(screen.getAllByTestId('toaster')).toHaveLength(1);
  });

  it('renders no toaster when the host has its own', () => {
    render(
      <PlateEditor
        editorConfig={editorConfig}
        onChange={() => {}}
        toaster={false}
      />,
    );

    expect(screen.queryByTestId('toaster')).toBeNull();
  });
});
