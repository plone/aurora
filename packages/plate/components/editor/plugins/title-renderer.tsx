import { createSlatePlugin } from 'platejs';
import { toPlatePlugin, type PlateElementProps } from 'platejs/react';
import { BlockInnerContainer } from '../../ui/block-inner-container';

export const TITLE_BLOCK_TYPE = 'title';

function TitleRendererElement(props: PlateElementProps) {
  return (
    // Styled by `.slate-title` in `styles/content.css`, as in the editor.
    <h1 {...props.attributes} className="slate-title">
      <BlockInnerContainer>{props.children}</BlockInnerContainer>
    </h1>
  );
}

export const BaseTitleRendererBlockPlugin = createSlatePlugin({
  key: TITLE_BLOCK_TYPE,
  node: {
    component: TitleRendererElement,
    isElement: true,
    type: TITLE_BLOCK_TYPE,
  },
});

export const TitleRendererBlock = toPlatePlugin(BaseTitleRendererBlockPlugin);
