import { type SlateElementProps, SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

export function BlockquoteElementStatic(props: SlateElementProps) {
  return (
    <SlateElement as="blockquote" {...props}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </SlateElement>
  );
}
