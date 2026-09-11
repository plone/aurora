import type { ConfigType } from '@plone/registry';
import type { BlockConfigBase } from '@plone/types';

import ImageBlockInfo from './Image';
import VideoBlockInfo from './Video';
import TeaserBlockInfo from './Teaser';
import ListingBlockInfo from './Listing';

export default function install(config: ConfigType) {
  // @ts-expect-error this is a quick hack for now
  // Initializing blocksConfig to empty.
  // We of course are assuming that this package will be installed before any
  // other package that wants to add blocks.
  config.blocks.blocksConfig = {};
  config.blocks.widths = [
    {
      style: {
        '--block-width': 'var(--narrow-container-width)',
      },
      name: 'narrow',
      label: 'Narrow',
    },
    {
      style: {
        '--block-width': 'var(--default-container-width)',
      },
      name: 'default',
      label: 'Default',
    },
    {
      style: {
        '--block-width': 'var(--layout-container-width)',
      },
      name: 'layout',
      label: 'Layout',
    },
    {
      style: {
        '--block-width': '100%',
      },
      name: 'full',
      label: 'Full Width',
    },
  ];
  config.blocks.alignments = [
    {
      name: 'left',
      label: 'Left',
      style: {
        '--block-alignment': 'var(--block-alignment-left, 0 auto)',
      },
    },
    {
      name: 'center',
      label: 'Center',
      style: {
        '--block-alignment': 'var(--block-alignment-center, auto)',
      },
    },
    {
      name: 'right',
      label: 'Right',
      style: {
        '--block-alignment': 'var(--block-alignment-right, auto 0)',
      },
    },
  ];
  config.blocks.sizes = [
    {
      name: 's',
      label: 'Small',
      style: {
        '--block-size': 'var(--block-size-small, 25%)',
      },
    },
    {
      name: 'm',
      label: 'Medium',
      style: {
        '--block-size': 'var(--block-size-medium, 50%)',
      },
    },
    {
      name: 'l',
      label: 'Large',
      style: {
        '--block-size': 'var(--block-size-large, 100%)',
      },
    },
  ];

  config.blocks.blocksConfig.image =
    ImageBlockInfo as unknown as BlockConfigBase;
  config.blocks.blocksConfig.teaser =
    TeaserBlockInfo as unknown as BlockConfigBase;
  config.blocks.blocksConfig.video =
    VideoBlockInfo as unknown as BlockConfigBase;
  config.blocks.blocksConfig.listing =
    ListingBlockInfo as unknown as BlockConfigBase;

  const plateBlocksConfig = {
    p: {
      category: 'text',
      blockWidth: {
        defaultWidth: 'narrow',
        widths: ['narrow'],
      },
    },
    h2: {
      category: 'text',
      blockWidth: {
        defaultWidth: 'narrow',
        widths: ['narrow'],
      },
    },
    h3: {
      category: 'text',
      blockWidth: {
        defaultWidth: 'narrow',
        widths: ['narrow'],
      },
    },
    h4: {
      category: 'text',
      blockWidth: {
        defaultWidth: 'narrow',
        widths: ['narrow'],
      },
    },
    h1: {
      category: 'text',
    },
    h5: {
      category: 'text',
    },
    h6: {
      category: 'text',
    },
    blockquote: {
      category: 'text',
    },
    code_block: {
      category: 'text',
    },
    toggle: {
      category: 'text',
    },
    title: {
      category: 'text',
      blockWidth: {
        defaultWidth: 'default',
        widths: ['default'],
      },
    },
    toc: {
      category: 'navigation',
      blockWidth: {
        defaultWidth: 'default',
        widths: ['layout', 'default', 'narrow'],
      },
    },
    callout: {
      category: 'common',
    },
    table: {
      category: 'common',
    },
    column_group: {
      category: 'layout',
    },
    column: {
      category: 'layout',
    },
    img: {
      category: 'media',
    },
    video: {
      category: 'media',
    },
    audio: {
      category: 'media',
    },
    file: {
      category: 'media',
    },
    media_embed: {
      category: 'media',
    },
  };

  config.blocks.plateBlocksConfig = plateBlocksConfig;
  config.registerUtility({
    type: 'styleFieldDefinition',
    name: 'blockWidth',
    method: () => config.blocks.widths ?? [],
  });
  config.registerUtility({
    type: 'styleFieldDefinition',
    name: 'align',
    method: () => config.blocks.alignments ?? [],
  });
  config.registerUtility({
    type: 'styleFieldDefinition',
    name: 'size',
    method: () => config.blocks.sizes ?? [],
  });

  return config;
}
