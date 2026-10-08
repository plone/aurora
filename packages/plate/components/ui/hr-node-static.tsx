import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

// Styled by `.block-hr__spacer` and `.block-hr__line` in `styles/content.css`.
export function HrElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div className="block-hr__spacer" contentEditable={false}>
        <hr className="block-hr__line" />
      </div>
      {props.children}
    </SlateElement>
  );
}
