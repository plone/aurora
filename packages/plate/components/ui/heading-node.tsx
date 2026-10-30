import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { BlockInnerContainer } from './block-inner-container';

// Styled by `.slate-h1` … `.slate-h6` in `styles/content.css`.
type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & { variant?: HeadingVariant | null }) {
  return (
    <PlateElement as={variant!} {...props}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </PlateElement>
  );
}

export function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />;
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />;
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />;
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />;
}
