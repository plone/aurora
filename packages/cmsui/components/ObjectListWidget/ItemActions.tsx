import { useTranslation } from 'react-i18next';
import { Button } from 'react-aria-components';
import { Menu, MenuItem, MenuTrigger } from '@plone/quanta';
import {
  ArrowdownIcon,
  ArrowupIcon,
  BinIcon,
  CopyIcon,
  MoreoptionsIcon,
} from '@plone/icons';

export type ItemAction = 'moveUp' | 'moveDown' | 'duplicate' | 'remove';

type ItemActionsProps = {
  /** The item's name, for the menu button's label. */
  title: string;
  index: number;
  count: number;
  canDuplicate: boolean;
  isDisabled?: boolean;
  onAction: (action: ItemAction) => void;
};

/** The class of the small icon buttons of a row. */
export const iconButtonClass = `
  flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0
  bg-transparent p-0 text-quanta-pigeon
  hover:bg-quanta-snow hover:text-quanta-space
  focus-visible:outline-2 focus-visible:outline-quanta-cobalt
  disabled:cursor-not-allowed disabled:opacity-40
  [&_svg]:size-5
`;

/**
 * The menu of one item: move it up or down, duplicate it, or remove it.
 * Moving with the menu is the way to reorder on touch screens, and while an
 * item is open.
 */
export function ItemActions({
  title,
  index,
  count,
  canDuplicate,
  isDisabled,
  onAction,
}: ItemActionsProps) {
  const { t } = useTranslation();
  const disabledKeys: ItemAction[] = [];
  if (index === 0) disabledKeys.push('moveUp');
  if (index === count - 1) disabledKeys.push('moveDown');
  if (!canDuplicate) disabledKeys.push('duplicate');

  return (
    <MenuTrigger placement="bottom end">
      <Button
        aria-label={t('cmsui.widgets.objectList.actions', { title })}
        isDisabled={isDisabled}
        className={iconButtonClass}
      >
        <MoreoptionsIcon />
      </Button>
      <Menu
        disabledKeys={disabledKeys}
        onAction={(key) => onAction(key as ItemAction)}
      >
        <MenuItem id="moveUp" textValue={t('cmsui.widgets.objectList.moveUp')}>
          <ArrowupIcon className="size-4" />
          {t('cmsui.widgets.objectList.moveUp')}
        </MenuItem>
        <MenuItem
          id="moveDown"
          textValue={t('cmsui.widgets.objectList.moveDown')}
        >
          <ArrowdownIcon className="size-4" />
          {t('cmsui.widgets.objectList.moveDown')}
        </MenuItem>
        <MenuItem
          id="duplicate"
          textValue={t('cmsui.widgets.objectList.duplicate')}
        >
          <CopyIcon className="size-4" />
          {t('cmsui.widgets.objectList.duplicate')}
        </MenuItem>
        <MenuItem
          id="remove"
          textValue={t('cmsui.widgets.objectList.remove')}
          className="text-quanta-candy"
        >
          <BinIcon className="size-4" />
          {t('cmsui.widgets.objectList.remove')}
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}
