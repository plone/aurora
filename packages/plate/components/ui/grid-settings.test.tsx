import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react';
import { useEditorRef } from 'platejs/react';
import { toast } from 'sonner';

import { PlateEditor } from '../editor';
import { BaseBasicBlocksKit } from '../editor/plugins/basic-blocks-base-kit';
import {
  getSettingsTarget,
  handleSettingsEscape,
  setSettingsTarget,
} from '../editor/plugins/block-settings';
import { insertGrid } from '../editor/plugins/grid/editor-transforms';
import { GridKit } from '../editor/plugins/grid/grid-kit';
import { BaseStyleFieldsKit } from '../editor/plugins/style-fields-base-kit';

vi.mock('sonner', () => ({
  toast: vi.fn(),
  Toaster: () => <div data-testid="toaster" />,
}));

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const column = (id: string, size: number, ...texts: string[]) => ({
  type: 'grid_column',
  id,
  size,
  children: texts.map(p),
});
const grid = (...columns: object[]) => ({
  type: 'grid',
  id: 'g',
  theme: 'default',
  gap: 'm',
  stack: true,
  children: columns,
});

function Capture({ onEditor }: { onEditor: (editor: any) => void }) {
  onEditor(useEditorRef());
  return null;
}

let sidebar: HTMLElement;

beforeEach(() => {
  vi.mocked(toast).mockClear();
  sidebar = document.createElement('aside');
  document.body.appendChild(sidebar);
});

afterEach(() => {
  sidebar.remove();
});

const renderGrid = async (value: object[]) => {
  let editor: any;
  render(
    <PlateEditor
      editorConfig={{
        plugins: [...BaseBasicBlocksKit, ...BaseStyleFieldsKit, ...GridKit],
      }}
      value={value as any}
      settingsContainer={() => sidebar}
      onChange={() => {}}
    >
      <Capture onEditor={(ed) => (editor = ed)} />
    </PlateEditor>,
  );
  await act(async () => setSettingsTarget(editor, { type: 'grid', id: 'g' }));
  return editor;
};

const sizes = (editor: any) =>
  editor.children[0].children.map((item: any) => item.size);
const side = () => within(sidebar);

describe('the grid settings', () => {
  it('shows the count, the layouts and the breadcrumb', async () => {
    await renderGrid([grid(column('a', 2, 'A'), column('b', 1, 'B'))]);
    const crumbs = side().getByRole('navigation', { name: 'Selection' });
    expect(within(crumbs).getByText('Grid')).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(side().getByText('2 columns')).toBeInTheDocument();
    expect(side().getByRole('radio', { name: 'Widths 2:1' })).toBeChecked();
    expect(side().getByRole('radio', { name: 'Widths 1:1' })).not.toBeChecked();
  });

  it('applies a layout, and the active one follows a reorder', async () => {
    const editor = await renderGrid([
      grid(column('a', 1, 'A'), column('b', 1, 'B')),
    ]);
    await act(async () => {
      fireEvent.click(side().getByRole('radio', { name: 'Widths 2:1' }));
    });
    expect(sizes(editor)).toEqual([2, 1]);

    await act(async () => {
      editor.tf.moveNodes({ at: [0, 0], to: [0, 1] });
      setSettingsTarget(editor, { type: 'grid', id: 'g' });
    });
    await waitFor(() =>
      expect(side().getByRole('radio', { name: 'Widths 1:2' })).toBeChecked(),
    );
  });

  it('adds and removes columns, merging content with an Undo', async () => {
    const editor = await renderGrid([
      grid(column('a', 1, 'A'), column('b', 1, 'B')),
    ]);
    await act(async () => {
      fireEvent.click(
        side().getByRole('button', { name: 'Add a column at the end' }),
      );
    });
    expect(editor.children[0].children).toHaveLength(3);

    for (const remaining of ['2 columns', '1 column']) {
      await act(async () => {
        fireEvent.click(
          side().getByRole('button', { name: 'Remove the last column' }),
        );
      });
      await waitFor(() =>
        expect(side().getByText(remaining)).toBeInTheDocument(),
      );
    }
    expect(editor.children[0].children).toHaveLength(1);
    expect(
      editor.children[0].children[0].children.map(
        (block: any) => block.children[0].text,
      ),
    ).toEqual(['A', 'B']);
    expect(toast).toHaveBeenCalledWith(
      'The content of column 2 moved to column 1',
      expect.anything(),
    );
    expect(
      side().getByRole('button', { name: 'Remove the last column' }),
    ).toBeDisabled();
  });

  it('sets the background, the headline, the gap and the stacking', async () => {
    const editor = await renderGrid([grid(column('a', 1, 'A'))]);
    await act(async () => {
      fireEvent.click(side().getByRole('radio', { name: 'Grey' }));
      fireEvent.change(side().getByLabelText('Headline'), {
        target: { value: 'Plan your visit' },
      });
      fireEvent.click(side().getByRole('radio', { name: 'Large' }));
      fireEvent.click(side().getByRole('radio', { name: 'Keep in a row' }));
    });
    expect(editor.children[0]).toMatchObject({
      theme: 'grey',
      headline: 'Plan your visit',
      gap: 'l',
      stack: false,
    });
  });

  it('deletes the grid with an Undo', async () => {
    const editor = await renderGrid([grid(column('a', 1, 'A')), p('After')]);
    await act(async () => {
      fireEvent.click(side().getByRole('button', { name: 'Delete grid' }));
    });
    expect(editor.children[0].type).toBe('p');
    expect(toast).toHaveBeenCalledWith('Grid deleted', expect.anything());
  });
});

describe('the column settings', () => {
  it('shows the column the caret is in, with its width and actions', async () => {
    const editor = await renderGrid([
      grid(column('a', 2, 'A'), column('b', 1, 'B')),
    ]);
    await act(async () => editor.tf.select(editor.api.start([0, 1, 0])));
    await waitFor(() =>
      expect(
        side().getByRole('heading', { name: 'Column 2 of 2' }),
      ).toBeVisible(),
    );
    expect(
      side().getByText('Width: 1 of 3 parts, set by the grid layout.'),
    ).toBeInTheDocument();
    expect(side().getByRole('button', { name: 'Move right' })).toBeDisabled();

    await act(async () => {
      fireEvent.click(side().getByRole('button', { name: 'Add column after' }));
    });
    expect(editor.children[0].children).toHaveLength(3);
  });
});

describe('the selection levels of a grid', () => {
  it('goes from a column up to the grid, the page and nothing with Esc', async () => {
    const editor = await renderGrid([grid(column('a', 1, 'A'))]);
    await act(async () => {
      setSettingsTarget(editor, null);
      editor.tf.select(editor.api.start([0, 0, 0]));
    });

    await act(async () => {
      expect(handleSettingsEscape(editor)).toBe(true);
    });
    expect(getSettingsTarget(editor)).toEqual({ type: 'grid', id: 'g' });
    await act(async () => handleSettingsEscape(editor));
    expect(getSettingsTarget(editor)).toEqual({ type: 'page' });
    await act(async () => handleSettingsEscape(editor));
    expect(getSettingsTarget(editor)).toBeNull();
  });

  it('opens the settings of a new grid', async () => {
    const editor = await renderGrid([p('Before')]);
    await act(async () => {
      setSettingsTarget(editor, null);
      editor.tf.select(editor.api.end([0]));
      insertGrid(editor);
    });
    expect(getSettingsTarget(editor)?.type).toBe('grid');
    await waitFor(() =>
      expect(side().getByRole('heading', { name: 'Grid' })).toBeVisible(),
    );
  });
});

describe('reaching the settings with the keyboard', () => {
  const handleButtons = (name: string) =>
    Array.from(
      document
        .querySelector(`[role="toolbar"][aria-label="${name}"]`)!
        .querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    );
  const sidebarControls = () =>
    Array.from(sidebar.querySelectorAll<HTMLElement>('button, input')).filter(
      (control) => !(control as HTMLButtonElement).disabled,
    );

  it('shows a column when its handle gets the focus', async () => {
    const editor = await renderGrid([
      grid(column('a', 1, 'A'), column('b', 1, 'B')),
    ]);
    await act(async () => setSettingsTarget(editor, null));
    await act(async () => handleButtons('Column 2 of 2')[0].focus());
    expect(getSettingsTarget(editor)).toEqual({
      type: 'grid_column',
      id: 'b',
    });
    await waitFor(() =>
      expect(
        side().getByRole('heading', { name: 'Column 2 of 2' }),
      ).toBeVisible(),
    );
  });

  it('goes from a handle to the settings, then to the next handle', async () => {
    const editor = await renderGrid([
      grid(column('a', 1, 'A'), column('b', 1, 'B')),
    ]);
    await act(async () => setSettingsTarget(editor, null));
    const first = handleButtons('Column 1 of 2');
    await act(async () => first[0].focus());
    await waitFor(() =>
      expect(
        side().getByRole('heading', { name: 'Column 1 of 2' }),
      ).toBeVisible(),
    );

    // Tab from the handle's last control goes into the settings.
    await act(async () => {
      fireEvent.keyDown(first.at(-1)!, { key: 'Tab' });
    });
    expect(document.activeElement).toBe(sidebarControls()[0]);

    // Shift+Tab from there goes back to the handle.
    await act(async () => {
      fireEvent.keyDown(sidebarControls()[0], { key: 'Tab', shiftKey: true });
    });
    expect(document.activeElement).toBe(first.at(-1));

    // From the settings' last control, Tab goes to the next column's handle.
    await act(async () => {
      fireEvent.keyDown(first.at(-1)!, { key: 'Tab' });
    });
    await act(async () => {
      fireEvent.keyDown(sidebarControls().at(-1)!, { key: 'Tab' });
    });
    expect(document.activeElement).toBe(handleButtons('Column 2 of 2')[0]);
    expect(getSettingsTarget(editor)).toEqual({
      type: 'grid_column',
      id: 'b',
    });
  });
});
