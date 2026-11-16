import type { PlateElementProps } from 'platejs/react';

import clsx from 'clsx';
import { ElementApi, KEYS, TextApi, type TElement } from 'platejs';
import { PlateElement, useEditorSelector } from 'platejs/react';

import { findGridNodePath } from '../editor/plugins/grid/editor-transforms';
import type {
  TGridColumnElement,
  TGridElement,
} from '../editor/plugins/grid/types';
import { useTranslation } from '../editor/plugins/i18n';
import { BlockInnerContainer } from './block-inner-container';
import { GridColumnHandle, GridInsertSeam } from './grid-column-controls';
import {
  getColumnProps,
  getGridAttributes,
  GridHeadline,
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
  const { t } = useTranslation();
  return (
    <PlateElement
      {...props}
      attributes={{
        ...props.attributes,
        ...getGridAttributes(element),
        role: 'group',
        'aria-label': t('plate.grid.label', { defaultValue: 'Grid' }),
      }}
    >
      <BlockInnerContainer>
        {element.headline && (
          <div contentEditable={false} className="select-none">
            <GridHeadline grid={element} />
          </div>
        )}
        <div className="block-grid__columns">{children}</div>
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
  // The column's place, read from the editor's value on every change.
  const place = useEditorSelector(
    (editor) => {
      const path = findGridNodePath(editor as any, element);
      if (!path) return '';
      const grid = editor.api.parent(path)?.[0] as TElement | undefined;
      return `${(path.at(-1) ?? 0) + 1}/${grid?.children.length ?? 1}`;
    },
    [element],
  );
  const [position, total] = (place || '1/1').split('/');

  return (
    <PlateElement
      {...props}
      className={clsx(
        className,
        'block-grid__column',
        `
          group/column relative rounded-md pt-8 outline-1 -outline-offset-1 outline-border
          outline-dashed
        `,
      )}
      attributes={{
        ...props.attributes,
        ...column.attributes,
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
      <GridColumnHandle element={element} />
      {isEmptyColumn(element) && (
        <span
          aria-hidden="true"
          contentEditable={false}
          className={`
            pointer-events-none absolute top-8 left-0 px-1 text-muted-foreground select-none
          `}
        >
          {t('plate.grid.emptyColumn', {
            defaultValue: 'Type / to add a block',
          })}
        </span>
      )}
      {children}
      <GridInsertSeam element={element} side="after" />
    </PlateElement>
  );
}
