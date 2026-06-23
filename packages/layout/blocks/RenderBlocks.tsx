import { Fragment, lazy } from 'react';
import { hasBlocksData } from '@plone/helpers';
import type { Content } from '@plone/types';
import { SOMERSAULT_KEY } from '@plone/plate/constants';
const SomersaultRenderer = lazy(() => import('./SomersaultRenderer'));

export type RenderBlocksProps = {
  /**
   * Plone content object
   */
  content: Content;
  /**
   * Wrap the blocks in an enclosing tag
   * From the registry or local to this instance (eg. in a blocks in block container)
   */
  as?: React.ElementType;
};

const RenderBlocks = (props: RenderBlocksProps) => {
  const { content } = props;
  const CustomTag = props.as || Fragment;
  const shouldRenderSomersault = Object.hasOwn(
    content.blocks ?? {},
    SOMERSAULT_KEY,
  );

  if (shouldRenderSomersault) {
    return (
      <CustomTag>
        <SomersaultRenderer content={content} />
      </CustomTag>
    );
  }

  if (!hasBlocksData(content)) return '';

  return '';
};

export default RenderBlocks;
