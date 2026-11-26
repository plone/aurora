import type { ConfigType } from '@plone/registry';
// TEMPORARY: the skin tuner testing tool, remove with SkinTuner.tsx
import SkinTuner from './SkinTuner';

export default function install(config: ConfigType) {
  // TEMPORARY: the skin tuner testing tool, remove with SkinTuner.tsx
  config.registerSlotComponent({
    name: 'SkinTuner',
    slot: 'belowContent',
    component: SkinTuner,
  });

  return config;
}
