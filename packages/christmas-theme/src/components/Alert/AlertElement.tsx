import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';

/**
 * AlertElement (Editor UI)
 *
 * Renders the editable alert box inside the Plate.js editor.
 * Includes a non-editable holiday icon and an editable children area.
 */
export function AlertElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} className="slate-alert">
      <BlockInnerContainer className="block-alert__inner">
        <div className="block-alert__wrapper">
          <div
            className="block-alert__icon"
            contentEditable={false}
            aria-hidden="true"
          >
            🔔
          </div>
          <div className="block-alert__content">{props.children}</div>
        </div>
      </BlockInnerContainer>
    </PlateElement>
  );
}

export default AlertElement;
