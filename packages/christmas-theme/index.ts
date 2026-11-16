import type { ConfigType } from '@plone/registry';
import type { BlockConfigBase } from '@plone/types';
import ChristmasBannerInfo from './src/components/Blocks/ChristmasBanner';

/**
 * Christmas Theme Installation & Configuration
 *
 * This function is invoked by Plone Aurora's registry system.
 * It registers both:
 * 1. The custom Plone Block: 'christmasBanner'
 * 2. The metadata configuration for the custom Plate Block: 'alert'
 */
export default function install(config: ConfigType) {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. REGISTER THE PLONE BLOCK (christmasBanner)
  // ──────────────────────────────────────────────────────────────────────────
  // Plone blocks live in config.blocks.blocksConfig.
  // The Aurora editor automatically adds this block into the Slash Menu ('/')
  // and wraps it using the PloneBlockAdapter and BlockAnatomy plugins.
  if (config.blocks?.blocksConfig) {
    config.blocks.blocksConfig.christmasBanner =
      ChristmasBannerInfo as unknown as BlockConfigBase;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CONFIGURE THE PLATE BLOCK (alert)
  // ──────────────────────────────────────────────────────────────────────────
  // Plate native blocks live in config.blocks.plateBlocksConfig.
  // We configure its category (for spacing and anatomy rules) and allowed widths.
  if (config.blocks?.plateBlocksConfig) {
    config.blocks.plateBlocksConfig.alert = {
      category: 'common',
      blockWidth: {
        defaultWidth: 'default',
        widths: ['narrow', 'default', 'layout'],
      },
    };
  }

  return config;
}
