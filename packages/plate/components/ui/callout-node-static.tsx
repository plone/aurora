import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

export function CalloutElementStatic({
  children,
  className,
  ...props
}: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <BlockInnerContainer
        className={className}
        style={{
          backgroundColor: props.element.backgroundColor as any,
        }}
      >
        <div className="block-callout__body">
          <div className="block-callout__icon">
            <span data-plate-prevent-deserialization>
              {(props.element.icon as any) || '💡'}
            </span>
          </div>
          <div className="block-callout__content">{children}</div>
        </div>
      </BlockInnerContainer>
    </SlateElement>
  );
}
