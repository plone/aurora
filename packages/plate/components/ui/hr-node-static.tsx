import type { SlateElementProps } from 'platejs';

import { SlateElement } from 'platejs';

// Divider styling is owned by shadcn/ui Typeset (`.typeset hr`).
export function HrElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div contentEditable={false}>
        <hr />
      </div>
      {props.children}
    </SlateElement>
  );
}
