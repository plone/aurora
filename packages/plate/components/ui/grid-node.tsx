import type * as React from 'react';
import type { PlateElementProps } from 'platejs/react';

import clsx from 'clsx';
import { ElementApi, KEYS, PathApi, TextApi, type TElement } from 'platejs';
import { PlateElement, useEditorRef, useEditorSelector } from 'platejs/react';

import { setSettingsTarget } from '../editor/plugins/block-settings';
import { findGridNodePath } from '../editor/plugins/grid/editor-transforms';
import { GRID_COLUMN_KEY, GRID_KEY } from '../editor/plugins/grid/types';
import type {
  TGridColumnElement,
  TGridElement,
} from '../editor/plugins/grid/types';
import { useTranslation } from '../editor/plugins/i18n';
import { BlockInnerContainer } from './block-inner-container';
import { useSettingsTarget } from './block-settings';
import { GridColumnHandle, GridInsertSeam } from './grid-column-controls';
import { GridColumnDropLine, useGridColumnDrag } from './grid-column-drag';
import {
  getColumnProps,
  getGridAttributes,
  GridColumnContext,
  GridHeadline,
  GridRenderProvider,
} from './grid-node-static';

/*
 * The grid in the editor: the same markup as the published view, so the
 * content looks the same, with editing affordances on top. Each column
 * reserves a strip at its top for its controls, so they never cover the
 * content; the published view has no such strip.
 */

const isEmptyParagraph = (node: unknown) =>
  ElementApi.isElement(node) &&
  node.type === KEYS.p &&
  !node.listStyleType &&
  node.children.every((child) => TextApi.isText(child) && !child.text);

/** Whether a column only holds an empty paragraph. */
export const isEmptyColumn = (column: TElement) =>
  column.children.length === 1 && isEmptyParagraph(column.children[0]);

export function GridElement(props: PlateElementProps<TGridElement>) {
  const { children, element } = props;
  const editor = useEditorRef();
  const { t } = useTranslation();
  return (
    <PlateElement
      {...props}
      attributes={{
        ...props.attributes,
        ...getGridAttributes(element),
        role: 'group',
        'aria-label': t('plate.grid.label', { defaultValue: 'Grid' }),
        // A press on the grid's frame, a gap or the headline, rather than a
        // column, selects the grid.
        onMouseDown: (event: React.MouseEvent) => {
          const target = event.target as HTMLElement;
          if (target.closest('button')) return;
          // The insert points sit in the gaps, inside the columns' markup.
          const inGap = !!target.closest('[data-grid-insert-seam]');
          if (!inGap && target.closest('.block-grid__column')) return;
          event.preventDefault();
          setSettingsTarget(editor, { type: GRID_KEY, id: element.id });
        },
      }}
    >
      <BlockInnerContainer>
        {element.headline && (
          <div contentEditable={false} className="select-none">
            <GridHeadline grid={element} />
          </div>
        )}
        <GridRenderProvider value={element}>
          <div className="block-grid__columns">{children}</div>
        </GridRenderProvider>
      </BlockInnerContainer>
    </PlateElement>
  );
}

export function GridColumnElement(
  props: PlateElementProps<TGridColumnElement>,
) {
  const { children, className, element } = props;
  const { t } = useTranslation();
  const column = getColumnProps(element);
  const { isDragging, nodeRef, handleRef } = useGridColumnDrag(element);
  // The column's place, read from the editor's value on every change.
  const place = useEditorSelector(
    (editor) => {
      const path = findGridNodePath(editor as any, element);
      if (!path) return '';
      const grid = editor.api.parent(path)?.[0] as TElement | undefined;
      const selection = editor.selection;
      const holdsCaret =
        !!selection &&
        PathApi.isAncestor(path, selection.anchor.path) &&
        PathApi.isAncestor(path, selection.focus.path);
      return `${(path.at(-1) ?? 0) + 1}/${grid?.children.length ?? 1}/${holdsCaret ? 1 : 0}`;
    },
    [element],
  );
  const [position, total, holdsCaret] = (place || '1/1/0').split('/');
  // The column holding the caret, or whose settings show, stands out.
  const target = useSettingsTarget();
  const selected =
    target?.type === GRID_COLUMN_KEY &&
    (target as { id?: string }).id === element.id;
  const active = selected || (!target && holdsCaret === '1');

  return (
    <PlateElement
      {...props}
      className={clsx(
        className,
        'block-grid__column',
        isDragging && 'opacity-50',
        // Edit mode only: a visible frame, a strip at the top for the
        // handle, and room around the blocks.
        `
          group/column relative rounded-md px-3.5 pt-9 pb-3 outline-1 -outline-offset-1
          outline-muted-foreground/45 transition-[outline-color] outline-dashed
          hover:outline-muted-foreground/80
          data-[active=true]:outline-2 data-[active=true]:-outline-offset-2
          data-[active=true]:outline-primary data-[active=true]:outline-solid
        `,
      )}
      attributes={{
        ...props.attributes,
        ...column.attributes,
        'data-active': active ? 'true' : 'false',
        role: 'group',
        'aria-label': t('plate.grid.columnOf', {
          defaultValue: 'Column {{position}} of {{total}}',
          position,
          total,
        }),
      }}
      style={{ ...props.style, ...column.style }}
    >
      <GridInsertSeam element={element} side="before" />
      <GridColumnHandle element={element} gripRef={handleRef} />
      <GridColumnDropLine id={element.id} />
      {isEmptyColumn(element) && (
        <span
          aria-hidden="true"
          contentEditable={false}
          className={`pointer-events-none absolute top-9 left-3.5 text-muted-foreground select-none`}
        >
          {t('plate.grid.emptyColumn', {
            defaultValue: 'Type / to add a block',
          })}
        </span>
      )}
      <div ref={nodeRef} className="h-full">
        <GridColumnContext column={element}>{children}</GridColumnContext>
      </div>
      <GridInsertSeam element={element} side="after" />
    </PlateElement>
  );
}
