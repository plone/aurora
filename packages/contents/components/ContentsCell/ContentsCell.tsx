import { type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from 'react-aria';
import { getContentIcon } from '@plone/helpers';
import type { Brain } from '@plone/types';
import { Link, Button, MenuTrigger } from '@plone/quanta';
import { MoreoptionsIcon } from '@plone/icons';
import { ItemActionsPopover } from '../ItemActionsPopover/ItemActionsPopover';
import ReviewState from '../ReviewState';
import { isDateSet, isExpired, isScheduled } from '../../helpers/dates';

interface Props {
  item: Brain;
  column: keyof Brain | '_actions';
  indexes: {
    order: string[];
    values: {
      [index: string]: {
        type: string;
        label: string;
        selected: boolean;
        sort_on?: string;
      };
    };
  };
  onMoveToTop: ComponentProps<typeof ItemActionsPopover>['onMoveToTop'];
  onMoveToBottom: ComponentProps<typeof ItemActionsPopover>['onMoveToBottom'];
  onCut: ComponentProps<typeof ItemActionsPopover>['onCut'];
  onCopy: ComponentProps<typeof ItemActionsPopover>['onCopy'];
  onDelete: ComponentProps<typeof ItemActionsPopover>['onDelete'];
}

export function ContentsCell({
  item,
  column,
  indexes,
  onMoveToTop,
  onMoveToBottom,
  onCut,
  onCopy,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const longFormatter = useDateFormatter({
    dateStyle: 'full',
    timeStyle: 'full',
  });
  const shortFormatter = useDateFormatter({
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const Icon = getContentIcon(item['@type'], item.is_folderish);

  if (column === 'title') {
    return (
      <Link
        className={`
          title-link flex w-fit max-w-full items-center gap-3 text-sm font-medium
          text-quanta-sapphire no-underline
          hover:underline
        `}
        href={`${item.is_folderish ? '/@@contents' : ''}${item['@id']}`}
      >
        <Icon
          title={item['Type'] || item['@type']}
          className="size-6 shrink-0 text-quanta-iron"
        />
        <span className="truncate">{item.title}</span>
        {isExpired(item.ExpirationDate) && (
          <span className="expired text-xs text-quanta-candy">
            {t('contents.item.expired')}
          </span>
        )}
        {isScheduled(item.EffectiveDate) && (
          <span className="future text-xs text-quanta-pigeon">
            {t('contents.item.scheduled')}
          </span>
        )}
      </Link>
    );
  } else if (column === '_actions') {
    return (
      <MenuTrigger placement="bottom end">
        <Button
          variant="icon"
          className={`
            item-actions-trigger opacity-0
            group-focus-within/row:opacity-100
            group-hover/row:opacity-100
            group-focus-visible/row:opacity-100
            aria-expanded:opacity-100
            pointer-coarse:opacity-100
          `}
          aria-label={t('contents.item.more_options')}
        >
          <MoreoptionsIcon />
        </Button>
        <ItemActionsPopover
          editLink={`/@@edit${item['@id']}`}
          viewLink={item['@id']}
          onMoveToBottom={onMoveToBottom}
          onMoveToTop={onMoveToTop}
          onCopy={onCopy}
          onCut={onCut}
          onDelete={onDelete}
        />
      </MenuTrigger>
    );
  } else {
    if (indexes.values[column].type === 'boolean') {
      return (
        <>
          {item[column]
            ? t('contents.indexes.boolean.yes')
            : t('contents.indexes.boolean.no')}
        </>
      );
    } else if (indexes.values[column].type === 'string') {
      if (column !== 'review_state') {
        return <>{item[column]}</>;
      } else {
        return (
          <ReviewState state={item[column]}>
            {t(
              'contents.indexes.review_state.' +
                (item[column] ?? 'no_workflow_state'),
            )}
          </ReviewState>
        );
      }
    } else if (indexes.values[column].type === 'date') {
      const dateString = item[column];
      if (isDateSet(dateString)) {
        const date = new Date(dateString);

        return (
          <time dateTime={dateString} title={longFormatter.format(date)}>
            {shortFormatter.format(date)}
          </time>
        );
      } else {
        return <>{t('contents.indexes.date.none')}</>;
      }
    } else if (indexes.values[column].type === 'array') {
      const value = item[column];
      return <>{Array.isArray(value) ? value.join(', ') : value}</>;
    } else {
      // TODO do we get here? needed for type checking?
      return null;
    }
  }
}
