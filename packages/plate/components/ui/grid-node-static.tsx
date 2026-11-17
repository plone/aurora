import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import clsx from 'clsx';
import { SlateElement } from 'platejs/static';

import { GRID_GAPS } from '../editor/plugins/grid/options';
import type {
  GridGap,
  TGridColumnElement,
  TGridElement,
} from '../editor/plugins/grid/types';
import { BlockInnerContainer } from './block-inner-container';

/*
 * The published view of the grid. It only uses contract classes and data
 * attributes: `.block-grid__headline`, `.block-grid__columns` and
 * `.block-grid__column`, with `data-gap`, `data-stack` and `data-size`.
 */

// The static `SlateElement` drops `attributes.ref`, so it's passed on.
const slateRef = (props: SlateElementProps<any>) =>
  (props.attributes as { ref?: React.Ref<any> }).ref;

export const getGridGap = (grid: TGridElement): GridGap =>
  GRID_GAPS.includes(grid.gap) ? grid.gap : 'm';

export const getColumnSize = (column: TGridColumnElement) =>
  typeof column.size === 'number' && column.size >= 1
    ? Math.round(column.size)
    : 1;

/** The data attributes of a grid, the same in the editor and the view. */
export const getGridAttributes = (grid: TGridElement) => ({
  'data-gap': getGridGap(grid),
  'data-stack': grid.stack === false ? 'false' : 'true',
});

/** The data attribute and the style of a column. */
export const getColumnProps = (column: TGridColumnElement) => {
  const size = getColumnSize(column);
  return {
    attributes: { 'data-size': String(size) },
    style: { '--block-grid-column-size': size } as React.CSSProperties,
  };
};

export function GridHeadline({ grid }: { grid: TGridElement }) {
  if (!grid.headline) return null;
  return <h2 className="block-grid__headline">{grid.headline}</h2>;
}

export function GridElementStatic(props: SlateElementProps<TGridElement>) {
  const { children, element } = props;
  return (
    <SlateElement
      {...props}
      ref={slateRef(props)}
      attributes={{ ...props.attributes, ...getGridAttributes(element) }}
    >
      <BlockInnerContainer>
        <GridHeadline grid={element} />
        <div className="block-grid__columns">{children}</div>
      </BlockInnerContainer>
    </SlateElement>
  );
}

export function GridColumnElementStatic(
  props: SlateElementProps<TGridColumnElement>,
) {
  const { children, className, element } = props;
  const column = getColumnProps(element);
  return (
    <SlateElement
      {...props}
      ref={slateRef(props)}
      className={clsx(className, 'block-grid__column')}
      attributes={{ ...props.attributes, ...column.attributes }}
      style={{ ...props.style, ...column.style }}
    >
      {children}
    </SlateElement>
  );
}
