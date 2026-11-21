import type { ReactNode, SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Disclosure,
  DisclosureGroupStateContext,
  DisclosurePanel,
  GridList,
  GridListItem,
  type DragAndDropHooks,
} from 'react-aria-components';
import { ChevrondownIcon, DraggableIcon, PencilIcon } from '@plone/icons';
import { ItemActions, iconButtonClass, type ItemAction } from './ItemActions';

/** What a row shows of one item. */
export type RowItem = {
  key: string;
  title: string;
  /** Shown when the item has no title, such as "Action 2". */
  fallbackTitle: string;
  summary: ReactNode;
  /** Some fields of the item have errors. */
  invalid?: boolean;
};

type ObjectListRowsProps = {
  rows: RowItem[];
  labelId: string;
  isDisabled?: boolean;
  canDuplicate: boolean;
  dragAndDropHooks?: DragAndDropHooks;
  onAction: (index: number, action: ItemAction) => void;
} & (
  | {
      /** Each row opens to edit its item in place. */
      mode: 'accordion';
      expandedKey: string | null;
      onExpandedChange: (key: string | null) => void;
      renderPanel: (index: number) => ReactNode;
    }
  | {
      /** Each row has an Edit button, which opens its item elsewhere. */
      mode: 'summary';
      onEdit: (index: number) => void;
    }
);

// Events from the fields of an open item (and from the popovers and dialogs
// of their widgets, which React passes up through portals) stay in the
// panel. The row would otherwise take pointer presses and keys meant for the
// fields. Tab still moves the focus out of the panel.
const stopInPanel = (event: SyntheticEvent) => event.stopPropagation();
const stopKeysInPanel = (event: React.KeyboardEvent) => {
  if (event.key !== 'Tab') event.stopPropagation();
};

/**
 * The items of an object list, one row each, in a React Aria `GridList`.
 *
 * A row drags by its handle, and its menu moves, duplicates or removes the
 * item. The list uses the `tab` keyboard navigation, so the fields inside an
 * open item get every key: arrow keys move the cursor, not the focus.
 */
export function ObjectListRows(props: ObjectListRowsProps) {
  const { t } = useTranslation();
  const {
    rows,
    labelId,
    isDisabled,
    canDuplicate,
    dragAndDropHooks,
    onAction,
  } = props;

  // The rows are disclosures of their own. Inside a disclosure group, such
  // as the accordion of a form's fieldsets, React Aria would make them items
  // of that group: opening an item would close the fieldset it's in.
  return (
    <DisclosureGroupStateContext.Provider value={null}>
      <GridList
        aria-labelledby={labelId}
        keyboardNavigationBehavior="tab"
        dragAndDropHooks={dragAndDropHooks}
        className="flex flex-col gap-2 outline-hidden"
      >
        {rows.map((row, index) => {
          const name = row.title || row.fallbackTitle;
          const isOpen =
            props.mode === 'accordion' && props.expandedKey === row.key;
          return (
            <GridListItem
              key={row.key}
              id={row.key}
              textValue={name}
              className={({ isFocusVisible, isDragging, isDropTarget }) => `
              rounded-lg border bg-quanta-air outline-hidden transition-shadow
              ${
                row.invalid
                  ? 'border-quanta-candy ring-1 ring-quanta-candy'
                  : isOpen
                    ? 'border-quanta-sapphire ring-1 ring-quanta-sapphire'
                    : 'border-quanta-smoke'
              }
              ${isFocusVisible ? 'ring-2 ring-quanta-cobalt' : ''}
              ${isDragging ? 'opacity-60 shadow-lg' : ''}
              ${isDropTarget ? 'border-quanta-sapphire' : ''}
            `}
            >
              {({ allowsDragging }) => (
                <div className="flex items-start gap-1 p-1.5">
                  {allowsDragging ? (
                    <Button
                      slot="drag"
                      className={`
                        ${iconButtonClass}
                        cursor-grab
                      `}
                    >
                      <DraggableIcon />
                    </Button>
                  ) : (
                    // Without dragging (an item is open, or the list is
                    // disabled), the handle is only a picture: the menu
                    // still moves the item.
                    <span
                      aria-hidden
                      className={`
                        ${iconButtonClass}
                        opacity-40
                      `}
                    >
                      <DraggableIcon />
                    </span>
                  )}
                  {props.mode === 'accordion' ? (
                    <Disclosure
                      isExpanded={isOpen}
                      onExpandedChange={(expanded) =>
                        props.onExpandedChange(expanded ? row.key : null)
                      }
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-1">
                        <RowTitle
                          row={row}
                          trigger
                          chevron={
                            <ChevrondownIcon
                              className={`
                                size-5 shrink-0 text-quanta-pigeon transition-transform
                                ${isOpen ? `rotate-180` : ''}
                              `}
                            />
                          }
                        />
                        <ItemActions
                          title={name}
                          index={index}
                          count={rows.length}
                          canDuplicate={canDuplicate}
                          isDisabled={isDisabled}
                          onAction={(action) => onAction(index, action)}
                        />
                      </div>
                      <DisclosurePanel>
                        <div
                          role="presentation"
                          onPointerDown={stopInPanel}
                          onMouseDown={stopInPanel}
                          onClick={stopInPanel}
                          onKeyDown={stopKeysInPanel}
                          className="px-1.5 pt-3 pb-2"
                        >
                          {isOpen && props.renderPanel(index)}
                        </div>
                      </DisclosurePanel>
                    </Disclosure>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <RowTitle row={row} />
                      <Button
                        aria-label={t('cmsui.widgets.objectList.edit', {
                          title: name,
                        })}
                        isDisabled={isDisabled}
                        onPress={() => props.onEdit(index)}
                        className={iconButtonClass}
                      >
                        <PencilIcon />
                      </Button>
                      <ItemActions
                        title={name}
                        index={index}
                        count={rows.length}
                        canDuplicate={canDuplicate}
                        isDisabled={isDisabled}
                        onAction={(action) => onAction(index, action)}
                      />
                    </div>
                  )}
                </div>
              )}
            </GridListItem>
          );
        })}
      </GridList>
    </DisclosureGroupStateContext.Provider>
  );
}

/** The title and summary line of a row, as the disclosure's trigger or not. */
function RowTitle({
  row,
  trigger = false,
  chevron,
}: {
  row: RowItem;
  trigger?: boolean;
  chevron?: ReactNode;
}) {
  const { t } = useTranslation();
  const content = (
    <>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={`
            truncate text-sm font-semibold
            ${
              row.title
                ? 'text-quanta-space'
                : `font-medium text-quanta-pigeon italic`
            }
          `}
        >
          {row.title || row.fallbackTitle}
        </span>
        {row.summary ? (
          <span className="truncate text-xs text-quanta-pigeon">
            {row.summary}
          </span>
        ) : null}
        {row.invalid && (
          <span className="text-xs text-quanta-candy">
            {t('cmsui.widgets.objectList.invalid')}
          </span>
        )}
      </span>
      {chevron}
    </>
  );

  if (!trigger) {
    return (
      <span className="flex min-w-0 flex-1 items-center px-1">{content}</span>
    );
  }
  return (
    <Button
      slot="trigger"
      className={`
        flex min-h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border-0
        bg-transparent px-1 py-0.5 text-left font-[inherit]
        hover:bg-quanta-snow
        focus-visible:outline-2 focus-visible:outline-quanta-cobalt
      `}
    >
      {content}
    </Button>
  );
}
