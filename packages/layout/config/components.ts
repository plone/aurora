import type { ConfigType } from '@plone/registry';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Container,
  Link,
  MenuItem,
  MenuTrigger,
} from '@plone/components';

export default function install(config: ConfigType) {
  config.registerComponent({ name: 'Breadcrumb', component: Breadcrumb });
  config.registerComponent({ name: 'Breadcrumbs', component: Breadcrumbs });
  config.registerComponent({ name: 'Button', component: Button });
  config.registerComponent({ name: 'Container', component: Container });
  config.registerComponent({ name: 'Link', component: Link });
  config.registerComponent({ name: 'MenuItem', component: MenuItem });
  config.registerComponent({ name: 'MenuTrigger', component: MenuTrigger });

  return config;
}
