import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';
import { cn } from '../../lib/utils';

export function ParagraphElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className={cn('m-0 px-0 py-1')}>
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </SlateElement>
  );
}
