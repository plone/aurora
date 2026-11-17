import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function KbdLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props} as="kbd">
      {props.children}
    </SlateLeaf>
  );
}
