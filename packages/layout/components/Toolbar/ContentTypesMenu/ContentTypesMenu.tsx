import { ToolbarMenu } from '../ToolbarMenu';
import Add from '@plone/icons/svg/add.svg?react';
import Page from '@plone/icons/svg/page.svg?react';
import type { Content, GetTypesResponse, Type } from '@plone/types';
import { Header, Menu, MenuSection, Text } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import config from '@plone/registry';
import contentTypesMenuStyles from './ContentTypesMenu.css?inline';

interface ContentTypesMenuProps {
  content: Content;
  /** The path of the content to add the new item in, like `/news`. */
  path: string;
}

export const ContentTypesMenu = ({ content, path }: ContentTypesMenuProps) => {
  const { t } = useTranslation();

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
    const Icon = config.settings.contentIcons[type.id] ?? Page;
    const MenuItem = config.getComponent('MenuItem').component!;

    return (
      <MenuItem id={type.id} href={`/@@add${path}?type=${typeToAdd}`}>
        <Icon />
        <Text slot="label">{type.title}</Text>
      </MenuItem>
    );
  };

  return (
    <ToolbarMenu
      mobileSheet
      icon={<Add />}
      triggerLabel={t('layout.toolbar.addContent')}
      styles={contentTypesMenuStyles}
    >
      <Menu
        className="menu-contenttypes-add"
        aria-label={t('layout.toolbar.addContent')}
      >
        <MenuSection className="most-used">
          <Header>{t('layout.toolbar.addContent')}</Header>
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
