import type { SlateElementProps } from 'platejs/static';

import { ChevronRight } from 'lucide-react';
import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

export function ToggleElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <BlockInnerContainer>
        <div className="block-toggle__icon" contentEditable={false}>
          <ChevronRight />
        </div>
        {props.children}
      </BlockInnerContainer>
    </SlateElement>
  );
}
