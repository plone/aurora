import * as React from 'react';

import type { RenderStaticNodeWrapper, TListElement } from 'platejs';
import type { SlateRenderElementProps } from 'platejs/static';

import { isOrderedList } from '@platejs/list';
import { CheckIcon } from 'lucide-react';

const config: Record<
  string,
  {
    Li: React.FC<SlateRenderElementProps>;
    Marker: React.FC<SlateRenderElementProps>;
  }
> = {
  todo: {
    Li: TodoLiStatic,
    Marker: TodoMarkerStatic,
  },
};

export const BlockListStatic: RenderStaticNodeWrapper = (props) => {
  if (!props.element.listStyleType) return;

  // eslint-disable-next-line react/display-name
  return (props) => <List {...props} />;
};

function List(props: SlateRenderElementProps) {
  const { listStart, listStyleType } = props.element as TListElement;
  const { Li, Marker } = config[listStyleType] ?? {};
  const List = isOrderedList(props.element) ? 'ol' : 'ul';

  return (
    <List className="block-p__list" style={{ listStyleType }} start={listStart}>
      {Marker && <Marker {...props} />}
      {Li ? (
        <Li {...props} />
      ) : (
        <li className="block-p__item">{props.children}</li>
      )}
    </List>
  );
}

function TodoMarkerStatic(props: SlateRenderElementProps) {
  const checked = props.element.checked as boolean;

  return (
    <div contentEditable={false}>
      <button
        className="block-p__checkbox"
        data-state={checked ? 'checked' : 'unchecked'}
        type="button"
      >
        <div className="block-p__checkmark">{checked && <CheckIcon />}</div>
      </button>
    </div>
  );
}

function TodoLiStatic(props: SlateRenderElementProps) {
  return (
    <li
      className="block-p__item"
      data-checked={(props.element.checked as boolean) ? '' : undefined}
    >
      {props.children}
    </li>
  );
}
