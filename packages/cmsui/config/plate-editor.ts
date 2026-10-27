import type { PlateEditorExtension } from '@plone/plate/extensions';
import { LinkKit } from '../components/BlockEditor/plugins/link-kit';
import { SidebarPlugin } from '../components/BlockEditor/plugins/SidebarPlugin';

// Collected by the somersault editor preset, so this code is only loaded
// with the editor.
const extension: PlateEditorExtension = {
  plugins: [SidebarPlugin, ...LinkKit],
};

export default extension;
