import { Button } from 'react-aria-components';
import { Link } from '@plone/components';
import { Dialog, Popover, type PopoverProps } from '@plone/quanta';
import EditIcon from '@plone/icons/svg/edit.svg?react';
import EyeIcon from '@plone/icons/svg/eye.svg?react';
import RowbeforeIcon from '@plone/icons/svg/row-before.svg?react';
import RowafterIcon from '@plone/icons/svg/row-after.svg?react';
import CutIcon from '@plone/icons/svg/cut.svg?react';
import CopyIcon from '@plone/icons/svg/copy.svg?react';
import BinIcon from '@plone/icons/svg/bin.svg?react';
import { useTranslation } from 'react-i18next';
import PopoverListItem from '../PopoverListItem';
import './ItemActionsPopover.css';

interface Props extends Omit<PopoverProps, 'children'> {
  editLink: string;
  viewLink: string;
  onMoveToTop: () => Promise<void>;
  onMoveToBottom: () => Promise<void>;
  onCut: () => void;
  onCopy: () => void;
  onDelete: () => Promise<void>;
}

export function ItemActionsPopover({
  editLink,
  viewLink,
  onMoveToTop,
  onMoveToBottom,
  onCut,
  onCopy,
  onDelete,
  ...popoverProps
}: Props) {
  const { t } = useTranslation();

  return (
    <Popover
      {...popoverProps}
      className="q react-aria-Popover item-actions-popover"
    >
      <Dialog
        aria-label={t('contents.actions.actions')}
        className="[[data-placement]>&]:p-3"
      >
        <ul className="popover-list">
          <PopoverListItem className="edit">
            <Link href={editLink}>
              <EditIcon />
              {t('contents.actions.edit')}
            </Link>
          </PopoverListItem>

          <PopoverListItem className="view">
            <Link href={viewLink}>
              <EyeIcon />
              {t('contents.actions.view')}
            </Link>
          </PopoverListItem>
          <PopoverListItem className="move-to-top">
            <Button onPress={onMoveToTop} className="react-aria-Link">
              <RowbeforeIcon />
              {t('contents.actions.move_to_top_folder')}
            </Button>
          </PopoverListItem>

          <PopoverListItem className="move-to-bottom">
            <Button onPress={onMoveToBottom} className="react-aria-Link">
              <RowafterIcon />
              {t('contents.actions.move_to_bottom_folder')}
            </Button>
          </PopoverListItem>
          <PopoverListItem className="cut">
            <Button onPress={onCut} className="react-aria-Link">
              <CutIcon />
              {t('contents.actions.cut')}
            </Button>
          </PopoverListItem>
          <PopoverListItem className="copy">
            <Button onPress={onCopy} className="react-aria-Link">
              <CopyIcon />
              {t('contents.actions.copy')}
            </Button>
          </PopoverListItem>
          <PopoverListItem className="delete">
            <Button onPress={onDelete} className="react-aria-Link">
              <BinIcon />
              {t('contents.actions.delete')}
            </Button>
          </PopoverListItem>
        </ul>
      </Dialog>
    </Popover>
  );
}
