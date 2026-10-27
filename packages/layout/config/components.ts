import type { ComponentType } from 'react';
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
  // The registry types components as `ComponentType<{}>`, which rejects
  // components with required props.
  config.registerComponent({
    name: 'Container',
    component: Container as ComponentType,
  });
  config.registerComponent({ name: 'Link', component: Link });
  config.registerComponent({ name: 'MenuItem', component: MenuItem });
  config.registerComponent({
    name: 'MenuTrigger',
    component: MenuTrigger as ComponentType,
  });

  return config;
}
