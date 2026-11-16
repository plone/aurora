import * as React from 'react';
import type { BlockConfigBase } from '@plone/types';
import { ChristmasBannerSchema } from './schema';

const ChristmasBannerInfo = {
  id: 'christmasBanner',
  title: 'Christmas Banner',
  category: 'common',
  blockSchema: ChristmasBannerSchema,
  view: React.lazy(
    () =>
      import(/* webpackChunkName: "plone-blocks" */ './ChristmasBannerView'),
  ),
  edit: React.lazy(
    () =>
      import(/* webpackChunkName: "plone-blocks" */ './ChristmasBannerEdit'),
  ),
} satisfies Partial<BlockConfigBase>;

export default ChristmasBannerInfo;
