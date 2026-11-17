import type { ConfigType } from '@plone/registry';
import installWidgets from './config/widgets';
import installControlpanels from './config/controlpanels';
import installRoutes from './config/routes';
import installSlots from './config/slots';
import installValidators from './config/validators';
import type { BlockConfigBase, FormWidgetProps } from '@plone/types';

declare module '@plone/types' {
  export interface BlocksConfigData {
    __somersault__: BlockConfigBase;
  }

  // The widgets registered for the CMS UI forms follow the widget contract,
  // so the type checker rejects a widget that doesn't take its props.
  export interface WidgetPropsMap {
    props: FormWidgetProps<any>;
  }
}

export default function install(config: ConfigType) {
  installWidgets(config);
  installControlpanels(config);
  installRoutes(config);
  installSlots(config);
  installValidators(config);

  return config;
}
