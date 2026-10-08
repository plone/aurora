import { type TCodeBlockElement } from 'platejs';
import {
  type SlateElementProps,
  type SlateLeafProps,
  SlateElement,
  SlateLeaf,
} from 'platejs/static';

import { BlockInnerContainer } from './block-inner-container';

export function CodeBlockElementStatic(
  props: SlateElementProps<TCodeBlockElement>,
) {
  return (
    <SlateElement {...props}>
      <BlockInnerContainer>
        <div className="block-code_block__frame">
          <pre className="block-code_block__pre">
            <code>{props.children}</code>
          </pre>
        </div>
      </BlockInnerContainer>
    </SlateElement>
  );
}

export function CodeLineElementStatic(props: SlateElementProps) {
  return <SlateElement {...props} />;
}

export function CodeSyntaxLeafStatic(props: SlateLeafProps) {
  const tokenClassName = props.leaf.className as string;

  return <SlateLeaf className={tokenClassName} {...props} />;
}
