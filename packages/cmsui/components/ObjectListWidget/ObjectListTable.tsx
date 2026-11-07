import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, type DragAndDropHooks } from 'react-aria-components';
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
} from '@plone/quanta';
import { PencilIcon } from '@plone/icons';
import { ItemActions, iconButtonClass, type ItemAction } from './ItemActions';

type ObjectListTableProps = {
  labelId: string;
  isDisabled?: boolean;
  canDuplicate: boolean;
  /** The columns: their field name and their title. */
  columns: Array<{ name: string; title: string }>;
  rows: Array<{
    key: string;
    name: string;
    cells: ReactNode[];
    /** Some fields of the item have errors. */
    invalid?: boolean;
  }>;
  dragAndDropHooks?: DragAndDropHooks;
  onEdit: (index: number) => void;
  onAction: (index: number, action: ItemAction) => void;
};

/**
 * The items of an object list as a table: one row per item, one column per
 * field asked for, and an Edit button and a menu on each row. Rows drag by
 * their handle.
 */
export function ObjectListTable({
  labelId,
  isDisabled,
  canDuplicate,
  columns,
  rows,
  dragAndDropHooks,
  onEdit,
  onAction,
}: ObjectListTableProps) {
  const { t } = useTranslation();
  return (
    <Table
      aria-labelledby={labelId}
      dragAndDropHooks={dragAndDropHooks}
      className="max-h-none"
    >
      <TableHeader dragColumnWidth={40}>
        {columns.map((column, index) => (
          <Column
            key={column.name}
            id={column.name}
            isRowHeader={index === 0}
            // A width: the table has no column resizers.
            width="1fr"
          >
            {column.title}
          </Column>
        ))}
        <Column id="__actions" width={88} minWidth={88}>
          <span className="sr-only">
            {t('cmsui.widgets.objectList.columnActions')}
          </span>
        </Column>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <Row key={row.key} id={row.key} textValue={row.name}>
            {row.cells.map((cell, cellIndex) => (
              <Cell key={columns[cellIndex].name}>
                {cell}
                {cellIndex === 0 && row.invalid && (
                  <span className="block text-xs text-quanta-candy">
                    {t('cmsui.widgets.objectList.invalid')}
                  </span>
                )}
              </Cell>
            ))}
            <Cell>
              <div className="flex justify-end gap-0.5">
                <Button
                  aria-label={t('cmsui.widgets.objectList.edit', {
                    title: row.name,
                  })}
                  isDisabled={isDisabled}
                  onPress={() => onEdit(index)}
                  className={iconButtonClass}
                >
                  <PencilIcon />
                </Button>
                <ItemActions
                  title={row.name}
                  index={index}
                  count={rows.length}
                  canDuplicate={canDuplicate}
                  isDisabled={isDisabled}
                  onAction={(action) => onAction(index, action)}
                />
              </div>
            </Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}
