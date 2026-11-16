import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Plate, PlateContent, createPlateEditor } from 'platejs/react';
import { toast } from 'sonner';

import { BaseBasicBlocksKit } from '../editor/plugins/basic-blocks-base-kit';
import { handleGridKeyDown } from '../editor/plugins/grid/grid-editor-plugin';
import { GridKit } from '../editor/plugins/grid/grid-kit';

vi.mock('sonner', () => ({
  toast: vi.fn(),
  Toaster: () => <div data-testid="toaster" />,
}));

const p = (text: string) => ({ type: 'p', children: [{ text }] });
const column = (id: string, size: number, text: string) => ({
  type: 'grid_column',
  id,
  size,
  children: [p(text)],
});
const grid = (...columns: object[]) => ({
  type: 'grid',
  id: 'g',
  theme: 'default',
  gap: 'm',
  stack: true,
  children: columns,
});

const renderGrid = (value: object[], options: Record<string, unknown> = {}) => {
  const editor = createPlateEditor({
    plugins: [
      ...BaseBasicBlocksKit,
      ...GridKit.map((plugin: any) =>
        plugin.key === 'grid' ? plugin.configure({ options }) : plugin,
      ),
    ],
    value: structuredClone(value) as any,
  });
  render(
    <Plate editor={editor}>
      <PlateContent />
    </Plate>,
  );
  return editor;
};

const texts = (editor: any) =>
  editor.children[0].children.map(
    (item: any) => item.children[0].children[0].text,
  );
const sizes = (editor: any) =>
  editor.children[0].children.map((item: any) => item.size);
const handle = (name: string) => screen.getByRole('toolbar', { name });
const announcer = () => document.querySelector('[data-plate-announcer]');

beforeEach(() => {
  vi.mocked(toast).mockClear();
});

afterEach(() => {
  announcer()?.remove();
});

describe('the column handle', () => {
  it('disables the moves at the ends and delete on the only column', () => {
    renderGrid([grid(column('a', 1, 'Only'))]);
    const toolbar = handle('Column 1 of 1');
    for (const name of ['Move left', 'Move right']) {
      expect(toolbar.querySelector(`[aria-label="${name}"]`)).toBeDisabled();
    }
    expect(
      toolbar.querySelector('[aria-label="A grid needs at least one column"]'),
    ).toBeDisabled();
  });

  it('moves a column right, keeping its weight, and announces it', async () => {
    const editor = renderGrid([grid(column('a', 2, 'A'), column('b', 1, 'B'))]);
    fireEvent.click(
      handle('Column 1 of 2').querySelector('[aria-label="Move right"]')!,
    );
    expect(texts(editor)).toEqual(['B', 'A']);
    expect(sizes(editor)).toEqual([1, 2]);
    await waitFor(() =>
      expect(announcer()).toHaveTextContent('Column moved to position 2 of 2'),
    );
  });

  it('duplicates a column, and not past the maximum', async () => {
    const editor = renderGrid(
      [grid(column('a', 1, 'A'), column('b', 1, 'B'))],
      {
        maxColumns: 3,
      },
    );
    fireEvent.click(
      handle('Column 1 of 2').querySelector('[aria-label="Duplicate column"]')!,
    );
    expect(texts(editor)).toEqual(['A', 'A', 'B']);
    const full = await screen.findByRole('toolbar', { name: 'Column 1 of 3' });
    expect(
      full.querySelector('[aria-label="The grid has its most columns"]'),
    ).toBeDisabled();
  });

  it('deletes a column with an Undo notification', () => {
    const editor = renderGrid([grid(column('a', 1, 'A'), column('b', 1, 'B'))]);
    const before = structuredClone(editor.children);
    fireEvent.click(
      handle('Column 2 of 2').querySelector('[aria-label="Delete column"]')!,
    );
    expect(texts(editor)).toEqual(['A']);
    expect(toast).toHaveBeenCalledWith(
      'Column deleted',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Undo' }),
      }),
    );
    act(() => editor.undo());
    expect(editor.children).toEqual(before);
  });

  it('hides while text is selected', async () => {
    const editor = renderGrid([grid(column('a', 1, 'Some text'))]);
    act(() =>
      editor.tf.select({
        anchor: { path: [0, 0, 0, 0], offset: 0 },
        focus: { path: [0, 0, 0, 0], offset: 4 },
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('toolbar', { name: 'Column 1 of 1' }),
      ).toBeNull(),
    );
  });
});

describe('the insert points', () => {
  it('insert an empty column in a gap and at the edges', async () => {
    const editor = renderGrid([grid(column('a', 2, 'A'), column('b', 1, 'B'))]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert a column at position 2' }),
    );
    expect(texts(editor)).toEqual(['A', '', 'B']);
    expect(sizes(editor)).toEqual([2, 1, 1]);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Insert a column at position 4',
      }),
    );
    expect(texts(editor)).toEqual(['A', '', 'B', '']);
  });

  it('are not offered when the grid has its most columns', () => {
    renderGrid([grid(column('a', 1, 'A'), column('b', 1, 'B'))], {
      maxColumns: 2,
    });
    expect(
      screen.queryByRole('button', { name: /^Insert a column/ }),
    ).toBeNull();
  });
});

describe('moving columns with the keyboard', () => {
  it('moves the column that holds the caret with Alt+Shift+arrows', async () => {
    const editor = renderGrid([
      grid(column('a', 1, 'A'), column('b', 1, 'B'), column('c', 1, 'C')),
    ]);
    act(() => editor.tf.select(editor.api.start([0, 0])!));
    const event = {
      key: 'ArrowRight',
      altKey: true,
      shiftKey: true,
      metaKey: false,
      ctrlKey: false,
      preventDefault: () => {},
    };
    act(() => {
      expect(handleGridKeyDown(editor, event)).toBe(true);
    });
    expect(texts(editor)).toEqual(['B', 'A', 'C']);
    // The caret moves with its column.
    expect(editor.selection?.anchor.path.slice(0, 2)).toEqual([0, 1]);
    await waitFor(() =>
      expect(announcer()).toHaveTextContent('Column moved to position 2 of 3'),
    );
  });
});
