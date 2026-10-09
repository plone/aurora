import type { ConfigType } from '@plone/registry';
import installWidgets from './config/widgets';
import installControlpanels from './config/controlpanels';
import installRoutes from './config/routes';
import installSlots from './config/slots';
import type { BlockConfigBase } from '@plone/types';

declare module '@plone/types' {
  export interface BlocksConfigData {
    __somersault__: BlockConfigBase;
  }
}

export default function install(config: ConfigType) {
  installWidgets(config);
  installControlpanels(config);
  installRoutes(config);
  installSlots(config);

  return config;
}
