import addonRendererModules from '@plone/registry/plate-renderer';
import type { PlateConfig } from '../../types';
import { composeRendererExtensions } from '../../extensions';
import { BlockBaseEditorKit } from '../../components/editor/block-editor-base-kit';
import { PloneBlockAdapterRendererPlugin } from '../../components/editor/plugins/plone-block-adapter-renderer';

import { TitleRendererBlock } from '../../components/editor/plugins/title-renderer';

// The add-ons' `config/plate-renderer` modules, in add-on order.
const extensions = composeRendererExtensions(addonRendererModules);

const nativeRenderer: PlateConfig = {
  readOnly: true,
  plugins: extensions.plugins([
    ...BlockBaseEditorKit,
    TitleRendererBlock,
    PloneBlockAdapterRendererPlugin,
  ]),
};

export default nativeRenderer;
