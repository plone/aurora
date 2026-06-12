import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from 'react-aria-components';
import type { Content } from '@plone/types';
import { ToolbarPopover } from '@plone/layout/components/Toolbar/ToolbarPopover';
import { Select, SelectItem } from '@plone/components';
import { MenuLinkItem } from '../MenuLinkItem/MenuLinkItem';

import MoreOptions from '@plone/components/icons/more-options.svg?react';
import History from '@plone/components/icons/history.svg?react';
import Share from '@plone/components/icons/share.svg?react';
import moreActionsMenuStyles from './MoreActionsMenu.css?inline';

interface MoreActionsMenu {
  content: Content;
}

export const MoreActionsMenu = ({ content }: MoreActionsMenu) => {
  const [selected, setSelected] = useState<string>('private');
  const { t } = useTranslation();

  return (
    <ToolbarPopover
      icon={<MoreOptions />}
      styles={moreActionsMenuStyles}
      className="menu-more-actions"
    >
      <Header>{t('publicui.toolbar.pageSettings')}</Header>
      <Select
        label={t('publicui.toolbar.state')}
        value={selected}
        onChange={(key) => setSelected(key as string)}
      >
        <SelectItem id="private">Private</SelectItem>
      </Select>
      <Select label={t('publicui.toolbar.appearance')}>
        <SelectItem id="private">Default</SelectItem>
      </Select>
      <div className="last-modified">
        <span>{t('publicui.toolbar.lastModified')}</span>
        <time>insert timestamp</time>
      </div>
      <nav>
        <MenuLinkItem
          as="link"
          icon={History}
          href="/@@history"
          label={t('publicui.toolbar.changes')}
        />
        <MenuLinkItem
          as="link"
          icon={Share}
          href="/@@sharing"
          label={t('publicui.toolbar.share')}
        />
      </nav>
    </ToolbarPopover>
  );
};
