import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Header, Menu, MenuSection } from 'react-aria-components';
import { ToolbarMenu } from '@plone/layout/components/Toolbar/ToolbarMenu';
import Add from '@plone/components/icons/add.svg?react';
import Page from '@plone/components/icons/page.svg?react';
import type { Content, GetTypesResponse, Type } from '@plone/types';
import config from '@plone/registry';
import { MenuLinkItem } from '../MenuLinkItem/MenuLinkItem';
import styles from './ContentTypesMenu.module.css';

interface ContentTypesMenuProps {
  content: Content;
}

export const ContentTypesMenu = ({ content }: ContentTypesMenuProps) => {
  const { t } = useTranslation();
  const location = useLocation();

  const _types: GetTypesResponse = content['@components']?.types;
  const types = Array.isArray(_types) ? _types : [];
  const addableTypes = types.filter((type) => type.addable);

  if (addableTypes.length === 0) return null;

  const mostUsedTypes = config.settings.mostUsedTypes;

  const highlightedTypes = addableTypes.filter((type) =>
    mostUsedTypes.includes(type.id),
  );

  const otherTypes = addableTypes.filter(
    (type) => !mostUsedTypes.includes(type.id),
  );

  const ContentTypeMenuItem = (type: Type) => {
    const typeToAdd = type['@id'].split('@types/')[1];
    const iconEntry = config.settings.contentIcons[type.id];
    const Icon =
      (typeof iconEntry !== 'string' ? iconEntry : undefined) ?? Page;

    return (
      <MenuLinkItem
        as="menuitem"
        id={type.id}
        icon={Icon}
        href={`/@@add${location.pathname}?type=${typeToAdd}`}
        label={type.title}
      />
    );
  };

  return (
    <ToolbarMenu icon={<Add />}>
      <Menu className={styles.menuContenttypesAdd}>
        <MenuSection className={styles.mostUsed}>
          <Header>{t('publicui.toolbar.addContent')}</Header>
          {highlightedTypes.length > 0 &&
            highlightedTypes.map((type) => (
              <ContentTypeMenuItem key={type.id} {...type} />
            ))}
        </MenuSection>
        <MenuSection className="types">
          {otherTypes.length > 0 &&
            otherTypes.map((type) => (
              <ContentTypeMenuItem key={type.id} {...type} />
            ))}
        </MenuSection>
      </Menu>
    </ToolbarMenu>
  );
};
