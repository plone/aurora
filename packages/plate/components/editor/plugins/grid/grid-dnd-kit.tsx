import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { DndPlugin } from '@platejs/dnd';

/** The drag type of grid columns: only columns accept them. */
export const GRID_COLUMN_DRAG_TYPE = 'grid_column';

/**
 * Drag and drop for the grid's column grips only. It renders the
 * `DndProvider`, without the `BlockDraggable` render that gives every block a
 * handle. In an editor that already has `DndKit`, the two merge into one
 * plugin with one provider, and its block handles stay.
 */
export const GridDndKit = [
  DndPlugin.configure({
    render: {
      aboveSlate: ({ children }) => (
        <DndProvider backend={HTML5Backend}>{children}</DndProvider>
      ),
    },
  }),
];
