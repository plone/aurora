import { Menu, MenuItem, MenuSeparator } from '@plone/quanta';
import {
  BinIcon,
  CopyIcon,
  CutIcon,
  EditIcon,
  EyeIcon,
  RowafterIcon,
  RowbeforeIcon,
} from '@plone/icons';
import { useTranslation } from 'react-i18next';

interface Props {
  editLink: string;
  viewLink: string;
  onMoveToTop: () => Promise<void>;
  onMoveToBottom: () => Promise<void>;
  onCut: () => void;
  onCopy: () => void;
  onDelete: () => Promise<void>;
}

const itemClassName = 'gap-4 border-b-0 py-1.5 text-quanta-space';
const iconClassName = 'shrink-0 text-quanta-pigeon';

/**
 * The menu of actions for a single item. Render it inside a `MenuTrigger`,
 * which places it in a popover.
 */
export function ItemActionsPopover({
  editLink,
  viewLink,
  onMoveToTop,
  onMoveToBottom,
  onCut,
  onCopy,
  onDelete,
}: Props) {
  const { t } = useTranslation();

  return (
    <Menu
      aria-label={t('contents.actions.actions')}
      className="min-w-48 px-1.5"
    >
      <MenuItem id="edit" href={editLink} className={itemClassName}>
        <EditIcon size="sm" className={iconClassName} />
        {t('contents.actions.edit')}
      </MenuItem>
      <MenuItem id="view" href={viewLink} className={itemClassName}>
        <EyeIcon size="sm" className={iconClassName} />
        {t('contents.actions.view')}
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        id="move-to-top"
        onAction={onMoveToTop}
        className={itemClassName}
      >
        <RowbeforeIcon size="sm" className={iconClassName} />
        {t('contents.actions.move_to_top_folder')}
      </MenuItem>
      <MenuItem
        id="move-to-bottom"
        onAction={onMoveToBottom}
        className={itemClassName}
      >
        <RowafterIcon size="sm" className={iconClassName} />
        {t('contents.actions.move_to_bottom_folder')}
      </MenuItem>
      <MenuSeparator />
      <MenuItem id="cut" onAction={onCut} className={itemClassName}>
        <CutIcon size="sm" className={iconClassName} />
        {t('contents.actions.cut')}
      </MenuItem>
      <MenuItem id="copy" onAction={onCopy} className={itemClassName}>
        <CopyIcon size="sm" className={iconClassName} />
        {t('contents.actions.copy')}
      </MenuItem>
      <MenuItem
        id="delete"
        onAction={onDelete}
        className={`
          ${itemClassName}
          text-quanta-candy
        `}
      >
        <BinIcon size="sm" className="shrink-0" />
        {t('contents.actions.delete')}
      </MenuItem>
    </Menu>
  );
}
