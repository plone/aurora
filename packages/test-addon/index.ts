import type { ConfigType } from '@plone/registry';
import type { BlockConfigBase } from '@plone/types';
import ObjectListTestBlockInfo from './ObjectListTest';

/**
 * Registers what the acceptance and visual regression tests need, and the
 * core doesn't ship. The app only loads this add-on when the
 * `PLONE_TEST_ADDON` environment variable is set at build time.
 */
export default function install(config: ConfigType) {
  config.blocks.blocksConfig.objectListTest =
    ObjectListTestBlockInfo as unknown as BlockConfigBase;
  return config;
}
