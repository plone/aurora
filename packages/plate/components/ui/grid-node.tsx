import type { PlateElementProps } from 'platejs/react';

import clsx from 'clsx';
import { PlateElement } from 'platejs/react';

import type {
  TGridColumnElement,
  TGridElement,
} from '../editor/plugins/grid/types';
import { BlockInnerContainer } from './block-inner-container';
import {
  getColumnProps,
  getGridAttributes,
  GridHeadline,
} from './grid-node-static';

/*
 * The grid in the editor: the same markup as the published view, so the
 * content looks the same, with editing controls on top.
 */

export function GridElement(props: PlateElementProps<TGridElement>) {
  const { children, element } = props;
  return (
    <PlateElement
      {...props}
      attributes={{ ...props.attributes, ...getGridAttributes(element) }}
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
  const column = getColumnProps(element);
  return (
    <PlateElement
      {...props}
      className={clsx(className, 'block-grid__column')}
      attributes={{ ...props.attributes, ...column.attributes }}
      style={{ ...props.style, ...column.style }}
    >
      {children}
    </PlateElement>
  );
}
