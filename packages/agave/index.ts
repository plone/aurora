import type { ConfigType } from '@plone/registry';
// TEMPORARY: theme preview toolbar, remove with its folder.
import ThemePreviewSwitcher from './components/ThemePreviewSwitcher/ThemePreviewSwitcher';

export default function install(config: ConfigType) {
  // TEMPORARY: theme preview toolbar, remove with its folder.
  config.registerSlotComponent({
    name: 'ThemePreviewSwitcher',
    slot: 'postFooter',
    component: ThemePreviewSwitcher,
  });

  return config;
}
