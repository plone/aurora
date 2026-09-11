import * as React from 'react';

import type { SlateElementProps } from 'platejs';

import { SlateElement } from 'platejs';

import { BlockInnerContainer } from './block-inner-container';

type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

// Heading typography (size, weight, rhythm) is owned by shadcn/ui Typeset —
// see `styles/typeset.css`. The component only selects the semantic tag.
export function HeadingElementStatic({
  variant = 'h1',
  ...props
}: SlateElementProps & { variant?: HeadingVariant }) {
  return (
    <SlateElement as={variant} {...props}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </SlateElement>
  );
}

export function H1ElementStatic(props: SlateElementProps) {
  return <HeadingElementStatic variant="h1" {...props} />;
}

export function H2ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>,
) {
  return <HeadingElementStatic variant="h2" {...props} />;
}

export function H3ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>,
) {
  return <HeadingElementStatic variant="h3" {...props} />;
}

export function H4ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>,
) {
  return <HeadingElementStatic variant="h4" {...props} />;
}

export function H5ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>,
) {
  return <HeadingElementStatic variant="h5" {...props} />;
}

export function H6ElementStatic(
  props: React.ComponentProps<typeof HeadingElementStatic>,
) {
  return <HeadingElementStatic variant="h6" {...props} />;
}
