import type { PlateConfig } from '../../types';
import { BlockEditorKit } from '../../components/editor/block-editor-kit';
import { BlockFloatingToolbarButtons } from '../../components/ui/preset-block-floating-toolbar-buttons';
import { setFloatingToolbarButtons } from '../../components/editor/plugins/floating-toolbar-kit';
import {
  PloneBlockAdapterPlugin,
  PloneBlockKeyboardPlugin,
} from '../../components/editor/plugins/plone-block-adapter';
import { PlaywrightPlugin } from '@platejs/playwright';

import { TitleBlock } from '../../components/editor/plugins/title';

setFloatingToolbarButtons(BlockFloatingToolbarButtons);

const native: PlateConfig = {
  plugins: [
    PloneBlockKeyboardPlugin,
    ...BlockEditorKit,
    TitleBlock,
    PloneBlockAdapterPlugin,
    // Include Playwright plugin only during e2e tests
    ...(typeof window !== 'undefined'
      ? [PlaywrightPlugin.configure({ enabled: true })]
      : []),
  ],
  floatingToolbarButtons: BlockFloatingToolbarButtons,
};

export default native;
