import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { BlockInnerContainer } from './block-inner-container';

// Styled by `.slate-p` in `styles/content.css`.
export function ParagraphElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </PlateElement>
  );
}
