import type { PlateElementProps } from 'platejs/react';

import { useTocElement, useTocElementState } from '@platejs/toc/react';
import { PlateElement } from 'platejs/react';

import { BlockInnerContainer } from './block-inner-container';

export function TocElement(props: PlateElementProps) {
  const state = useTocElementState();
  const { props: btnProps } = useTocElement(state);
  const { headingList } = state;

  return (
    <PlateElement {...props}>
      <BlockInnerContainer>
        <div contentEditable={false}>
          {headingList.length > 0 ? (
            headingList.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block-toc__item"
                data-depth={item.depth}
                onClick={(e) => btnProps.onClick(e, item, 'smooth')}
                aria-current
              >
                {item.title}
              </button>
            ))
          ) : (
            <div className="block-toc__empty">
              Create a heading to display the table of contents.
            </div>
          )}
        </div>
        {props.children}
      </BlockInnerContainer>
    </PlateElement>
  );
}
