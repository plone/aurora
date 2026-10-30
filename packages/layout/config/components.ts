import type { ComponentProps, ElementType, ReactNode } from 'react';
import type { ConfigType } from '@plone/registry';
import type { MenuItemProps, MenuProps } from 'react-aria-components';
import type { ComponentSignature } from '@plone/types';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Container,
  Link,
  Menu,
  MenuItem,
  MenuTrigger,
  type BreadcrumbsProps,
  type ContainerProps,
} from '@plone/components';

// Generic components are declared by signature, so `getComponent` keeps their
// type parameters.
declare module '@plone/types' {
  export interface ComponentsPropsMap {
    Breadcrumb: ComponentProps<typeof Breadcrumb>;
    Breadcrumbs: ComponentSignature<
      <T extends Breadcrumb>(props: BreadcrumbsProps<T>) => ReactNode
    >;
    Button: ComponentProps<typeof Button>;
    Container: ComponentSignature<
      <T extends ElementType = 'div'>(props: ContainerProps<T>) => ReactNode
    >;
    Link: ComponentProps<typeof Link>;
    Menu: ComponentSignature<
      <T extends object>(props: MenuProps<T>) => ReactNode
    >;
    MenuItem: ComponentSignature<
      <T extends object>(props: MenuItemProps<T>) => ReactNode
    >;
    MenuTrigger: ComponentProps<typeof MenuTrigger>;
  }
}

export default function install(config: ConfigType) {
  config.registerComponent({ name: 'Breadcrumb', component: Breadcrumb });
  config.registerComponent({ name: 'Breadcrumbs', component: Breadcrumbs });
  config.registerComponent({ name: 'Button', component: Button });
  config.registerComponent({ name: 'Container', component: Container });
  config.registerComponent({ name: 'Link', component: Link });
  config.registerComponent({ name: 'Menu', component: Menu });
  config.registerComponent({ name: 'MenuItem', component: MenuItem });
  config.registerComponent({ name: 'MenuTrigger', component: MenuTrigger });

  return config;
}
