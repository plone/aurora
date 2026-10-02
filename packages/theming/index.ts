import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  // Default cascade layer order, emitted by `/layers.css` before any other
  // stylesheet. Resets go in `base`, block content CSS in `plone-content` (it
  // beats the reset and loses to utilities and site customizations in
  // `custom`). Add-ons may append layers; this add-on is expected to load first.
  config.settings.cssLayers = [
    'theme',
    'base',
    'components',
    'plone-components',
    'plone-content',
    'utilities',
    'custom',
  ];
  return config;
}
