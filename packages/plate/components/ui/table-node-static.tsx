import * as React from 'react';

import type { TTableCellElement, TTableElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { BaseTablePlugin } from '@platejs/table';
import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

type CellBorders = Partial<
  Record<'top' | 'right' | 'bottom' | 'left', { size?: number } | undefined>
>;

/** Marks the sides of a cell that have a border, for the content styles. */
export function cellBorderAttributes(borders?: CellBorders) {
  return {
    'data-border-top': borders?.top?.size ? '' : undefined,
    'data-border-right': borders?.right?.size ? '' : undefined,
    'data-border-bottom': borders?.bottom?.size ? '' : undefined,
    'data-border-left': borders?.left?.size ? '' : undefined,
  };
}

export function TableElementStatic({
  children,
  ...props
}: SlateElementProps<TTableElement>) {
  const { disableMarginLeft } = props.editor.getOptions(BaseTablePlugin);
  const marginLeft = disableMarginLeft ? 0 : props.element.marginLeft;

  return (
    <SlateElement {...props}>
      <BlockInnerContainer>
        <div
          className="block-table__scroll"
          style={{ paddingLeft: marginLeft }}
        >
          <div className="block-table__wrapper">
            <table className="block-table__table">
              <tbody>{children}</tbody>
            </table>
          </div>
        </div>
      </BlockInnerContainer>
    </SlateElement>
  );
}

export function TableRowElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} as="tr">
      {props.children}
    </SlateElement>
  );
}

export function TableCellElementStatic({
  isHeader,
  ...props
}: SlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const { editor, element } = props;
  const { api } = editor.getPlugin(BaseTablePlugin);

  const { minHeight, width } = api.table.getCellSize({ element });
  const borders = api.table.getCellBorders({ element });

  return (
    <SlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: width || 240,
          minWidth: width || 120,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element),
        ...cellBorderAttributes(borders),
      }}
    >
      <div className="block-table__cell-content" style={{ minHeight }}>
        {props.children}
      </div>
    </SlateElement>
  );
}

export function TableCellHeaderElementStatic(
  props: SlateElementProps<TTableCellElement>,
) {
  return <TableCellElementStatic {...props} isHeader />;
}
