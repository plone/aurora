import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

// Styled by `.slate-h1` … `.slate-h6` in `styles/content.css`.
type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export function HeadingElementStatic({
  variant = 'h1',
  ...props
}: SlateElementProps & { variant?: HeadingVariant | null }) {
  return (
    <SlateElement as={variant!} {...props}>
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
