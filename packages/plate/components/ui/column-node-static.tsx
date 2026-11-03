import type { TColumnElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

export function ColumnElementStatic(props: SlateElementProps<TColumnElement>) {
  const { width } = props.element;

  return (
    <div
      className="block-column_group__column"
      style={{ width: width ?? '100%' }}
    >
      <SlateElement {...props}>
        <div className="block-column__content">{props.children}</div>
      </SlateElement>
    </div>
  );
}

export function ColumnGroupElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <BlockInnerContainer>
        <div className="block-column_group__row">{props.children}</div>
      </BlockInnerContainer>
    </SlateElement>
  );
}
