import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

// Styled by `.slate-p` in `styles/content.css`.
export function ParagraphElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </SlateElement>
  );
}
