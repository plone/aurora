import { type ComponentType, useId } from 'react';
import { Text } from 'react-aria-components';

import { Link, MenuItem } from '@plone/components';
import ChevronRight from '@plone/components/icons/chevron-right.svg?react';

interface MenuLinkItemProps {
  as: 'menuitem' | 'link';
  label: string;
  href: string;
  id?: string;
  icon?: ComponentType<any>;
}

export const MenuLinkItem = ({
  as,
  id,
  icon: Icon,
  label,
  href,
}: MenuLinkItemProps) => {
  const generatedId = useId();
  const Component = as === 'menuitem' ? MenuItem : Link;

  return (
    <Component
      id={id ? id : generatedId}
      className="react-aria-MenuItem menu-link-wrapper"
      href={href}
    >
      {Icon && <Icon />}
      <Text slot="label">{label}</Text>
      <ChevronRight />
    </Component>
  );
};
