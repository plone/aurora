import type { PlateRendererExtension } from '@plone/plate/extensions';
import { BaseAlertPlugin } from '../src/components/Alert/plugin';

/**
 * Plate Renderer Extension for @plone/christmas-theme
 *
 * Automatically discovered by the @plone/registry Vite plugin.
 * Loaded only in the Public UI and SSR renderer.
 */
const extension: PlateRendererExtension = {
  plugins: [BaseAlertPlugin],
};

export default extension;
