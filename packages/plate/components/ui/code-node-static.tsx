import type { SlateLeafProps } from 'platejs/static';

import { SlateLeaf } from 'platejs/static';

export function CodeLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props} as="code">
      {props.children}
    </SlateLeaf>
  );
}
