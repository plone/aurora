import type { BlockConfigBase } from '@plone/types';
import ObjectListTestView from './ObjectListTestView';
import { ObjectListTestSchema } from './schema';

/**
 * A block whose settings have an `object_list` field in each layout. It's
 * restricted, so it never shows in the block chooser: the tests create it in
 * the page's data.
 */
const ObjectListTestBlockInfo = {
  id: 'objectListTest',
  title: 'Object list test',
  view: ObjectListTestView,
  edit: ObjectListTestView,
  category: 'common',
  restricted: true,
  blockSchema: ObjectListTestSchema,
} satisfies Partial<BlockConfigBase>;

export default ObjectListTestBlockInfo;
