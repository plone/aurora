import addonEditorModules from '@plone/registry/plate-editor';
import type { PlateConfig } from '../../types';
import { composeEditorExtensions } from '../../extensions';
import { createBlockEditorKit } from '../../components/editor/block-editor-kit';
import { BlockFloatingToolbarButtons } from '../../components/ui/preset-block-floating-toolbar-buttons';
import { setFloatingToolbarButtons } from '../../components/editor/plugins/floating-toolbar-kit';
import {
  PloneBlockAdapterPlugin,
  PloneBlockKeyboardPlugin,
} from '../../components/editor/plugins/plone-block-adapter';
import { PloneImageUploadPlugin } from '../../components/editor/plugins/plone-image-upload';
import { PlaywrightPlugin } from '@platejs/playwright';

import { TitleBlock } from '../../components/editor/plugins/title';

// The add-ons' `config/plate-editor` modules, in add-on order.
const extensions = composeEditorExtensions(addonEditorModules);

const floatingToolbarButtons = extensions.floatingToolbar(
  BlockFloatingToolbarButtons,
);
setFloatingToolbarButtons(floatingToolbarButtons);

const native: PlateConfig = {
  plugins: extensions.plugins([
    PloneBlockKeyboardPlugin,
    ...createBlockEditorKit({ slashMenu: extensions.slashMenu }),
    TitleBlock,
    PloneBlockAdapterPlugin,
    PloneImageUploadPlugin,
    // Include Playwright plugin only during e2e tests
    ...(typeof window !== 'undefined'
      ? [PlaywrightPlugin.configure({ enabled: true })]
      : []),
  ]),
  floatingToolbarButtons,
};

export default native;
