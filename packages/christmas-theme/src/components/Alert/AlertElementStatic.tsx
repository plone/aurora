import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';

/**
 * AlertElementStatic (Public UI & SSR)
 *
 * Lightweight, static render of the holiday alert element for public reading.
 */
export function AlertElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} className="slate-alert">
      <BlockInnerContainer className="block-alert__inner">
        <div className="block-alert__wrapper">
          <div className="block-alert__icon" aria-hidden="true">
            🔔
          </div>
          <div className="block-alert__content">{props.children}</div>
        </div>
      </BlockInnerContainer>
    </SlateElement>
  );
}

export default AlertElementStatic;
