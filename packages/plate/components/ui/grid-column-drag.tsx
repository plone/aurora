import {
  getHoverDirection,
  useDraggable,
  useDropLine,
  type DragItemNode,
} from '@platejs/dnd';
import { ElementApi, PathApi, type TElement } from 'platejs';

import { cn } from '../../lib/utils';
import { moveColumnTo } from '../editor/plugins/grid/column-actions';
import { findGridNodePath } from '../editor/plugins/grid/editor-transforms';
import { GRID_COLUMN_DRAG_TYPE } from '../editor/plugins/grid/grid-dnd-kit';
import { GRID_COLUMN_KEY } from '../editor/plugins/grid/types';

/*
 * Dragging a column by its grip, to another position of its grid. Drops are
 * only accepted on the columns of the same grid.
 */

const dragId = (item: DragItemNode) => {
  const id = (item as { id?: string[] | string }).id;
  return Array.isArray(id) ? id[0] : id;
};

/**
 * Where a column dragged from `from` ends up when dropped on the left or the
 * right side of the column at `over`.
 */
export const getColumnDropIndex = (
  from: number,
  over: number,
  side: 'left' | 'right' | 'top' | 'bottom',
) => {
  const before = side === 'right' || side === 'bottom' ? over + 1 : over;
  return before > from ? before - 1 : before;
};

/** The drag and drop state of a column, and the drop that moves it. */
export const useGridColumnDrag = (element: TElement) =>
  useDraggable({
    element,
    orientation: 'horizontal',
    type: GRID_COLUMN_DRAG_TYPE,
    drop: { accept: [GRID_COLUMN_DRAG_TYPE] },
    canDropNode: ({ dragEntry, dropEntry }) =>
      !!dragEntry &&
      dragEntry[0].type === GRID_COLUMN_KEY &&
      PathApi.equals(
        PathApi.parent(dragEntry[1]),
        PathApi.parent(dropEntry[1]),
      ),
    onDropHandler: (editor, { dragItem, monitor, nodeRef }) => {
      const direction = getHoverDirection({
        dragItem,
        element,
        monitor,
        nodeRef,
        orientation: 'horizontal',
      });
      const id = dragItem && 'id' in dragItem ? dragId(dragItem) : undefined;
      const dropPath = findGridNodePath(editor as any, element);
      const drag = id
        ? editor.api.node<TElement>({
            at: [],
            match: (node) =>
              ElementApi.isElement(node) &&
              node.type === GRID_COLUMN_KEY &&
              node.id === id,
          })
        : undefined;
      if (!direction || !dropPath || !drag) return true;
      const gridPath = PathApi.parent(dropPath);
      if (!PathApi.equals(PathApi.parent(drag[1]), gridPath)) return true;

      const from = drag[1].at(-1)!;
      const to = getColumnDropIndex(from, dropPath.at(-1)!, direction);
      if (to !== from) moveColumnTo(editor as any, gridPath, from, to);
      return true;
    },
  });

/** A vertical line at the side of a column where a dragged one will land. */
export function GridColumnDropLine({ id }: { id: string }) {
  const { dropLine } = useDropLine({ id, orientation: 'horizontal' });
  if (dropLine !== 'left' && dropLine !== 'right') return null;
  return (
    <div
      contentEditable={false}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-primary',
        dropLine === 'left'
          ? 'left-[calc(var(--block-grid-gap)/-2)]'
          : 'right-[calc(var(--block-grid-gap)/-2)]',
      )}
    />
  );
}
