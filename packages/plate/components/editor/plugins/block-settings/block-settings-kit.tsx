import { BlockSettingsHost } from '../../../ui/block-settings';
import { BlockSettingsPlugin } from './block-settings-plugin';

/**
 * The shared selection levels, with the settings host. Kits of blocks that
 * declare settings include it; the editor merges the copies into one.
 */
export const BlockSettingsKit = [
  BlockSettingsPlugin.configure({
    render: { afterEditable: BlockSettingsHost },
  }),
];
