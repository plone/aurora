import type { SlateLeafProps } from 'platejs';

import { SlateLeaf } from 'platejs';

// Inline code styling is owned by shadcn/ui Typeset (`.typeset :not(pre) > code`).
export function CodeLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props} as="code">
      {props.children}
    </SlateLeaf>
  );
}
