import type { SlateElementProps } from 'platejs';

import { SlateElement } from 'platejs';

import { BlockInnerContainer } from './block-inner-container';

// Prose styling (spacing, colour) is owned by shadcn/ui Typeset — see
// `styles/typeset.css` and the `.typeset` wrapper on the read-only renderer.
export function ParagraphElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </SlateElement>
  );
}
