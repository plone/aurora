import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { atom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { Button, useDragAndDrop } from 'react-aria-components';
import { useResizeObserver } from 'usehooks-ts';
import { twMerge } from 'tailwind-merge';
import { FormProvider } from '@plone/helpers';
import type { FormWidgetProps } from '@plone/types';
import { AddIcon } from '@plone/icons';
import { ObjectFields } from '../ObjectWidget/ObjectFields';
import { useWidgetForm } from '../ObjectWidget/useWidgetForm';
import {
  cellText,
  dropIndex,
  duplicateItem,
  itemKeys,
  moveItem,
  newItem,
  resolveItemSchema,
  schemaFields,
  summaryOf,
  titleOf,
  withItemIds,
  type ItemSchema,
  type ItemSchemaEnhancer,
  type ItemSchemaSource,
  type ItemTitle,
  type ObjectListItem,
} from './objectList';
import type { ItemAction } from './ItemActions';
import { ObjectListRows } from './ObjectListRows';
import { ObjectListTable } from './ObjectListTable';
import { ItemDialog } from './ItemDialog';
import { RemoveItemDialog } from './RemoveItemDialog';

/** How a column's cells render an item's value. Other columns show text. */
export type CellRenderer = (value: unknown, item: ObjectListItem) => ReactNode;

export type ObjectListWidgetProps = FormWidgetProps<ObjectListItem[] | null> & {
  /**
   * The field's schema, which holds the item schema as `schema`, or the item
   * schema itself, or a function that builds it from the widget's props.
   */
  schema?: FormWidgetProps['schema'] | ItemSchemaSource;
  /** The name of a registered `schema` utility building the item schema. */
  schemaName?: string;
  /** Enhances the item schema for each item, from the item's values. */
  schemaEnhancer?: ItemSchemaEnhancer;
  /**
   * `accordion`, the default, edits each item in place. `table` shows each
   * item as a row and edits it in a dialog.
   */
  layout?: 'accordion' | 'table';
  /** The table's columns: field names of the item schema. Default: all. */
  columns?: string[];
  /** How the cells of a column render, by field name. */
  cells?: Record<string, CellRenderer>;
  /** The field that names an item, or a function that names it. */
  itemTitle?: ItemTitle;
  /** The most items the list can hold. */
  maxItems?: number;
  /** The `@id` of the open item, to control it (accordion only). */
  expandedItem?: string | null;
  /** Called when an item is opened or closed (accordion only). */
  onExpandedChange?: (id: string | null) => void;
};

// Below this width, the table shows its items as a list of rows, as in the
// sidebar: 28rem.
const NARROW_TABLE = 448;
const DRAG_TYPE = 'application/x-plone-object-list-item';

/**
 * Edits a list of objects whose fields a schema describes, such as the
 * actions of a site or its social links. Registered as `widget: 'object_list'`.
 *
 * The value is a list of objects, each with an `@id`, as Volto's
 * `object_list` widget stores it. The item schema is the field's `schema`,
 * or a registered `schema` utility named by `schemaName`.
 *
 * - The `accordion` layout (the default) edits each item in place. Its
 *   fields are fields of the form at `<name>.<index>.<field>`.
 * - The `table` layout shows the `columns` of each item in a row and edits
 *   the item in a dialog, with a draft of its own.
 *
 * Items reorder by dragging (also with the keyboard) or with their menu.
 */
export function ObjectListWidget(props: ObjectListWidgetProps) {
  const {
    name,
    value,
    onChange,
    label,
    description,
    required,
    disabled,
    readOnly,
    invalid,
    errorMessage,
    className,
    schemaEnhancer,
    layout = 'accordion',
    columns: columnNames,
    cells,
    itemTitle,
    maxItems,
  } = props;
  const { t } = useTranslation();
  const labelId = useId();
  const descriptionId = useId();
  const items = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const keys = useMemo(() => itemKeys(items), [items]);
  const form = useWidgetForm({ name, value: value ?? null, onChange });

  const schema = useMemo(
    () => resolveItemSchema(props),
    // The schema only depends on where it comes from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.schema, props.schemaName],
  );
  const enhanced = (item: ObjectListItem): ItemSchema =>
    schemaEnhancer ? schemaEnhancer({ schema, formData: item, t }) : schema;

  const itemName = schema.title || label || t('cmsui.widgets.objectList.item');
  const addLabel =
    schema.addMessage || t('cmsui.widgets.objectList.add', { item: itemName });
  const isDisabled = !!disabled || !!readOnly;
  const canAdd =
    !isDisabled && (maxItems === undefined || items.length < maxItems);

  // The open item, by key. Controlled with `expandedItem`, if given.
  const [localExpanded, setLocalExpanded] = useState<string | null>(null);
  const expanded =
    props.expandedItem !== undefined ? props.expandedItem : localExpanded;
  const setExpanded = (key: string | null) => {
    setLocalExpanded(key);
    props.onExpandedChange?.(key);
  };

  // The item in the dialog (table layout), and the item about to be removed.
  const [editing, setEditing] = useState<{
    index: number | null;
    item: ObjectListItem;
  } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  // The items whose fields show errors: the form validates them with the
  // item schema (see `buildSchemaValidators`).
  const itemPaths = items.map((item, index) =>
    Object.keys(enhanced(item).properties).map(
      (field) => `${name}.${index}.${field}`,
    ),
  );
  const itemPathsKey = JSON.stringify(itemPaths);
  const invalidAtom = useMemo(
    () =>
      atom((get) =>
        itemPaths.map((paths) =>
          paths.some((path) => get(form.metaAtom(path)).invalid),
        ),
      ),
    // The paths are compared by their contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, itemPathsKey],
  );
  const invalidItems = useAtomValue(invalidAtom, { store: form.store });

  // When a submit fails on the fields of an item, the item opens, so the form
  // can focus its first field with errors. An open item with errors stays
  // open.
  const { submitCount } = useAtomValue(form.stateAtom, { store: form.store });
  useEffect(() => {
    if (!submitCount || layout !== 'accordion') return;
    const paths = Object.keys(form.getErrors());
    const hasErrors = (index: number) =>
      paths.some((path) => path.startsWith(`${name}.${index}.`));
    const open = expanded === null ? -1 : keys.indexOf(expanded);
    if (open >= 0 && hasErrors(open)) return;
    const first = items.findIndex((_, index) => hasErrors(index));
    if (first >= 0) setExpanded(keys[first]);
    // Only each submit opens an item, not each change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  const change = (next: ObjectListItem[]) => onChange(withItemIds(next));
  const titleAt = (index: number) =>
    titleOf(items[index], index, schema, itemTitle) ||
    t('cmsui.widgets.objectList.untitled', {
      item: itemName,
      position: index + 1,
    });

  const add = () => {
    const item = newItem(enhanced({}));
    if (layout === 'table') {
      setEditing({ index: null, item });
      return;
    }
    change([...items, item]);
    setExpanded(item['@id'] as string);
  };

  const onAction = (index: number, action: ItemAction) => {
    switch (action) {
      case 'moveUp':
        change(moveItem(items, index, index - 1));
        break;
      case 'moveDown':
        change(moveItem(items, index, index + 1));
        break;
      case 'duplicate': {
        const copy = duplicateItem(items[index]);
        change([...items.slice(0, index + 1), copy, ...items.slice(index + 1)]);
        break;
      }
      case 'remove':
        setRemoving(index);
        break;
    }
  };

  const remove = () => {
    if (removing === null) return;
    if (keys[removing] === expanded) setExpanded(null);
    change(items.filter((_, index) => index !== removing));
    setRemoving(null);
  };

  // An open item's fields take the pointer, so rows drag only while every
  // item is closed. The menu still moves them.
  const { dragAndDropHooks } = useDragAndDrop({
    isDisabled: isDisabled || items.length < 2 || expanded !== null,
    getItems: (dragged) =>
      [...dragged].map((key) => ({
        [DRAG_TYPE]: String(key),
        'text/plain': titleAt(keys.indexOf(String(key))),
      })),
    acceptedDragTypes: [DRAG_TYPE],
    onReorder: (event) => {
      const moved = [...event.keys][0];
      const from = keys.indexOf(String(moved));
      const target = keys.indexOf(String(event.target.key));
      if (from < 0 || target < 0) return;
      const to = dropIndex(from, target, event.target.dropPosition);
      if (to !== from) change(moveItem(items, from, to));
    },
  });

  // The table becomes a list of rows where it has no room, as in the sidebar.
  const containerRef = useRef<HTMLDivElement>(null);
  const { width = Infinity } = useResizeObserver({
    ref: containerRef as React.RefObject<HTMLDivElement>,
  });
  const isNarrow = width < NARROW_TABLE;
  const columns = (columnNames?.length ? columnNames : schemaFields(schema))
    .filter((field) => schema.properties[field])
    .map((field) => ({
      name: field,
      title: schema.properties[field].title ?? field,
    }));
  const renderCell = (item: ObjectListItem, field: string) =>
    cells?.[field]
      ? cells[field](item[field], item)
      : cellText(schema.properties[field], item[field]);

  const rows = items.map((item, index) => {
    const title = titleOf(item, index, schema, itemTitle);
    return {
      key: keys[index],
      title,
      fallbackTitle: titleAt(index),
      invalid: invalidItems[index] ?? false,
      summary: summaryOf(
        item,
        schema,
        title,
        layout === 'table' ? columnNames : undefined,
      ),
    };
  });

  const addButton = (
    <Button
      onPress={add}
      isDisabled={!canAdd}
      className={
        layout === 'table'
          ? `
            inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg
            border-[1.5px] border-quanta-sky bg-quanta-arctic py-2 pr-4 pl-3 text-sm font-bold
            whitespace-nowrap text-quanta-sapphire
            hover:border-quanta-sapphire
            focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-quanta-cobalt
            disabled:cursor-not-allowed disabled:opacity-50
          `
          : `
            flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg
            border-2 border-dashed border-quanta-azure bg-quanta-arctic/60 px-4 py-3 text-sm
            font-bold text-quanta-sapphire
            hover:border-solid hover:border-quanta-sapphire hover:bg-quanta-arctic
            focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-quanta-cobalt
            disabled:cursor-not-allowed disabled:opacity-50
          `
      }
    >
      <span
        aria-hidden
        className={`
          flex size-5 items-center justify-center rounded-full bg-quanta-sapphire text-quanta-air
          [&_svg]:size-4
        `}
      >
        <AddIcon />
      </span>
      {addLabel}
    </Button>
  );

  let list: ReactNode;
  if (items.length === 0) {
    list = (
      <div
        className={`
          flex flex-col items-center gap-3 rounded-lg border-[1.5px] border-dashed
          border-quanta-smoke px-4 py-5 text-center text-sm text-quanta-pigeon
        `}
      >
        {t('cmsui.widgets.objectList.empty')}
        {layout === 'accordion' && <div className="w-full">{addButton}</div>}
      </div>
    );
  } else if (layout === 'table' && !isNarrow) {
    list = (
      <ObjectListTable
        labelId={labelId}
        isDisabled={isDisabled}
        canDuplicate={canAdd}
        columns={columns}
        rows={items.map((item, index) => ({
          key: keys[index],
          name: rows[index].title || rows[index].fallbackTitle,
          cells: columns.map((column) => renderCell(item, column.name)),
          invalid: invalidItems[index] ?? false,
        }))}
        dragAndDropHooks={dragAndDropHooks}
        onEdit={(index) => setEditing({ index, item: items[index] })}
        onAction={onAction}
      />
    );
  } else if (layout === 'table') {
    list = (
      <ObjectListRows
        mode="summary"
        rows={rows.map((row, index) => {
          const first = columns[0]?.name;
          return first && cells?.[first]
            ? { ...row, summary: renderCell(items[index], first) }
            : row;
        })}
        labelId={labelId}
        isDisabled={isDisabled}
        canDuplicate={canAdd}
        dragAndDropHooks={dragAndDropHooks}
        onEdit={(index) => setEditing({ index, item: items[index] })}
        onAction={onAction}
      />
    );
  } else {
    list = (
      <FormProvider form={form}>
        <ObjectListRows
          mode="accordion"
          rows={rows}
          labelId={labelId}
          isDisabled={isDisabled}
          canDuplicate={canAdd}
          dragAndDropHooks={dragAndDropHooks}
          onAction={onAction}
          expandedKey={expanded}
          onExpandedChange={setExpanded}
          renderPanel={(index) => (
            <ObjectFields
              schema={enhanced(items[index])}
              path={`${name}.${index}`}
            />
          )}
        />
      </FormProvider>
    );
  }

  return (
    <div
      ref={containerRef}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={description ? descriptionId : undefined}
      data-required={required || undefined}
      data-invalid={invalid || undefined}
      className={twMerge('group flex flex-col gap-3', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            id={labelId}
            className={`
              text-sm font-semibold text-quanta-iron
              group-data-invalid:text-quanta-candy
            `}
          >
            {label}
            {required && (
              <span
                aria-hidden
                className="mx-1 inline-block size-1.5 rounded-full bg-quanta-rose align-middle"
              />
            )}
            {items.length > 0 && (
              <span
                aria-hidden
                className="ml-1.5 text-xs font-medium text-quanta-pigeon"
              >
                {items.length}
              </span>
            )}
          </span>
          {description && (
            <span id={descriptionId} className="text-xs text-quanta-pigeon">
              {description}
            </span>
          )}
        </div>
        {layout === 'table' && addButton}
      </div>
      {list}
      {layout === 'accordion' && items.length > 0 && addButton}
      {invalid && errorMessage && (
        <span className="text-xs text-quanta-candy">{errorMessage}</span>
      )}
      {editing && (
        <ItemDialog
          key={editing.item['@id'] ?? 'new'}
          item={editing.item}
          isNew={editing.index === null}
          itemName={itemName}
          schema={schema}
          schemaEnhancer={schemaEnhancer}
          onCancel={() => setEditing(null)}
          onSave={(item) => {
            const index = editing.index;
            change(
              index === null
                ? [...items, item]
                : items.map((current, position) =>
                    position === index ? item : current,
                  ),
            );
            setEditing(null);
          }}
        />
      )}
      {removing !== null && (
        <RemoveItemDialog
          title={titleAt(removing)}
          onCancel={() => setRemoving(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

ObjectListWidget.displayName = 'ObjectListWidget';
