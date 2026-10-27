import { type PlateElementProps, PlateElement } from 'platejs/react';

import { BlockInnerContainer } from './block-inner-container';

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement as="blockquote" {...props}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </PlateElement>
  );
}
