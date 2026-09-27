import React from 'react';
import type { BlockConfigBase } from '@plone/types';
import { MapsSchema } from './schema';
import MapsBlockView from './MapsBlockView';
import { WorldIcon } from '@plone/components/Icons';

const MapsBlockInfo = {
  id: 'maps',
  title: 'Maps',
  view: MapsBlockView,
  edit: React.lazy(
    () => import(/* webpackChunkName: "plone-blocks" */ './MapsBlockEdit'),
  ),
  category: 'common',
  blockSchema: MapsSchema,
  icon: WorldIcon,
} satisfies Partial<BlockConfigBase>;

export default MapsBlockInfo;
