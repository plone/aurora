import type { ReactNode } from 'react';
import cx from 'clsx';
import type { RenderBlocksProps } from './RenderBlocks';
import type { BlocksFormData } from '@plone/types';
import {
  getStyleFieldDefinitionsFromRegistry,
  resolveBlockAnatomy,
  resolveStyleFields,
} from '@plone/helpers';
import { getBlockStyleFieldConfigs } from '../helpers';

type BlockWrapperProps = Partial<RenderBlocksProps> & {
  children: ReactNode;
  data: BlocksFormData;
};

const BlockWrapper = (props: BlockWrapperProps) => {
  const { blocksConfig, children, data } = props;
  const category =
    blocksConfig?.[data['@type'] as keyof typeof blocksConfig]?.category;
  const { style } = resolveStyleFields({
    data,
    fieldConfigs: getBlockStyleFieldConfigs(data, blocksConfig),
    container: undefined,
    resolveDefinitions: getStyleFieldDefinitionsFromRegistry,
  });
  const anatomy = resolveBlockAnatomy({
    type: data['@type'],
    category,
  });

  return (
    <div
      className={cx(anatomy.className)}
      {...anatomy.dataAttributes}
      style={style}
    >
      <div className="block-inner-container">{children}</div>
    </div>
  );
};

export default BlockWrapper;
