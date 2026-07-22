import { type SlateElementProps, SlateElement } from 'platejs';

import { BlockInnerContainer } from './block-inner-container';

// Blockquote styling (border, padding, colour) is owned by shadcn/ui Typeset.
export function BlockquoteElementStatic(props: SlateElementProps) {
  return (
    <SlateElement as="blockquote" {...props}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </SlateElement>
  );
}
