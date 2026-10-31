import { useCallback, useState } from 'react';
import {
  Button as RACButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop,
  type DropTarget,
  type Key,
} from 'react-aria-components';
import { useSchemaField } from '@plone/helpers';
import { Button } from '@plone/quanta';
import { DraggableIcon } from '@plone/icons';
import { useTranslate } from '../../../provider/ControlPanelsProvider';
import { useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import {
  canRemoveFieldset,
  holdsCustomFields,
  isCustomField,
  moveFields,
  moveFieldsets,
  removeFieldset,
} from '../../schemaEditing';
import type {
  BehaviorInfo,
  FieldType,
  SchemaField,
  TypeSchema,
} from '../../types';
import { useDriverData } from '../../useDriverData';
import { AddFieldDialog } from './AddFieldDialog';
import { AddFieldsetDialog } from './AddFieldsetDialog';
import { FieldEditor } from './FieldEditor';

export interface FieldsTabProps {
  /** The behaviors that can add fields, to name where locked fields come from. */
  behaviors?: BehaviorInfo[];
}

const listStyles = `
  flex min-w-0 flex-col overflow-auto rounded-lg border border-quanta-smoke
  data-[focus-visible]:outline-2 data-[focus-visible]:outline-quanta-sapphire
`;

const rowStyles = ({
  isSelected,
  isFocusVisible,
  isDragging,
  isDropTarget,
}: {
  isSelected?: boolean;
  isFocusVisible?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
}) =>
  [
    'flex items-center gap-3 border-b border-quanta-smoke px-3 py-2 text-sm outline-none',
    'last:border-b-0',
    isSelected ? 'bg-quanta-snow font-semibold' : 'hover:bg-quanta-air',
    isFocusVisible ? '-outline-offset-2 outline-2 outline-quanta-sapphire' : '',
    isDragging ? 'opacity-50' : '',
    isDropTarget ? 'bg-quanta-snow' : '',
  ].join(' ');

const renderDropIndicator = (target: DropTarget) => (
  <DropIndicator
    target={target}
    className={({ isDropTarget }) =>
      `h-0.5 ${isDropTarget ? 'bg-quanta-sapphire' : 'bg-transparent'}`
    }
  />
);

/** Rows that can't move get a disabled handle, like the design's dimmed grip. */
function DragHandle({
  label,
  isDisabled,
}: {
  label: string;
  isDisabled?: boolean;
}) {
  return (
    <RACButton
      slot="drag"
      aria-label={label}
      isDisabled={isDisabled}
      className={`
        flex shrink-0 cursor-grab rounded text-quanta-iron outline-none
        data-[disabled]:cursor-default data-[disabled]:opacity-35
        data-[focus-visible]:outline-2 data-[focus-visible]:outline-quanta-sapphire
      `}
    >
      <DraggableIcon size="sm" aria-hidden />
    </RACButton>
  );
}

function fieldKind(field: SchemaField, fieldTypes: FieldType[] = []) {
  const { factory } = field;
  return (
    fieldTypes.find((type) => type.id === factory)?.title ??
    factory ??
    field.type ??
    ''
  );
}

/**
 * A type's fieldsets and fields: every field the edit form shows, in order.
 * Fields from behaviors are locked. The type's own fields open an editor,
 * and can be reordered by dragging or with the keyboard. Changes go into the
 * page's form, and are saved with the rest of the type.
 */
export function FieldsTab({ behaviors = [] }: FieldsTabProps) {
  const t = useTranslate();
  const driver = useContentTypesDriver();
  const { capabilities } = driver;
  const loadFieldTypes = useCallback(() => driver.listFieldTypes(), [driver]);
  const fieldTypes = useDriverData(loadFieldTypes);
  const field = useSchemaField<TypeSchema>('schema');
  const schema = field.value;
  const [selected, setSelected] = useState<string>('default');
  const [editing, setEditing] = useState<string | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [isAddingFieldset, setIsAddingFieldset] = useState(false);

  const behaviorTitle = (name?: string) =>
    behaviors.find((behavior) => behavior.name === name)?.title ?? name ?? '';

  const fieldDrag = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    // Only the type's own fields move, so only they are drop targets.
    getDropOperation: (target) =>
      target.type === 'item' &&
      !isCustomField(schema?.properties[String(target.key)])
        ? 'cancel'
        : 'move',
    onReorder: ({ keys, target }) => {
      if (!schema || target.dropPosition === 'on') return;
      field.onChange(
        moveFields(
          schema,
          [...keys].map(String),
          String(target.key),
          target.dropPosition,
        ),
      );
    },
    renderDropIndicator,
  });

  const fieldsetDrag = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: ({ keys, target }) => {
      if (!schema || target.dropPosition === 'on') return;
      field.onChange(
        moveFieldsets(
          schema,
          [...keys].map(String),
          String(target.key),
          target.dropPosition,
        ),
      );
    },
    renderDropIndicator,
  });

  if (!schema) {
    return (
      <p className="text-sm text-quanta-pigeon">
        {t(messages.schemaLoadError)}
      </p>
    );
  }

  const fieldset =
    schema.fieldsets.find((entry) => entry.id === selected) ??
    schema.fieldsets[0];
  const lockedKeys = fieldset.fields.filter(
    (name) => !isCustomField(schema.properties[name]),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" accent onPress={() => setIsAddingField(true)}>
          {t(messages.addField)}
        </Button>
        <Button onPress={() => setIsAddingFieldset(true)}>
          {t(messages.addFieldset)}
        </Button>
      </div>

      <div
        className={`
          grid gap-4
          md:grid-cols-[minmax(10rem,14rem)_1fr]
        `}
      >
        <GridList
          aria-label={t(messages.fieldsets)}
          items={schema.fieldsets}
          selectionMode="single"
          selectionBehavior="replace"
          disallowEmptySelection
          selectedKeys={[fieldset.id]}
          onSelectionChange={(keys) => {
            const [key] = [...(keys as Set<Key>)];
            if (key !== undefined) setSelected(String(key));
          }}
          dragAndDropHooks={
            capabilities.fieldsetOrder
              ? fieldsetDrag.dragAndDropHooks
              : undefined
          }
          className={`
            ${listStyles}
            self-start
          `}
        >
          {(entry) => (
            <GridListItem
              id={entry.id}
              textValue={entry.title}
              className={rowStyles}
            >
              {({ allowsDragging }) => (
                <>
                  {allowsDragging && (
                    <DragHandle
                      label={entry.title}
                      isDisabled={entry.id === 'default'}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                  <span className="font-mono text-xs text-quanta-pigeon">
                    {entry.fields.length}
                  </span>
                </>
              )}
            </GridListItem>
          )}
        </GridList>

        <div className="flex min-w-0 flex-col gap-3">
          <GridList
            aria-label={t(messages.fieldsIn, { fieldset: fieldset.title })}
            items={fieldset.fields.map((name) => ({ name }))}
            // The rows show more of the schema than their item.
            dependencies={[schema]}
            disabledKeys={lockedKeys}
            onAction={(key) => setEditing(String(key))}
            dragAndDropHooks={fieldDrag.dragAndDropHooks}
            renderEmptyState={() => (
              <p className="px-3 py-4 text-sm text-quanta-pigeon">
                {t(messages.noFields)}
              </p>
            )}
            className={listStyles}
          >
            {({ name }) => {
              const entry = schema.properties[name] ?? { title: name };
              const label = entry.title || name;
              const custom = isCustomField(entry);
              const required = schema.required.includes(name);
              return (
                <GridListItem
                  id={name}
                  textValue={label}
                  className={(state) =>
                    `${rowStyles(state)} ${custom ? 'cursor-pointer' : ''}`
                  }
                >
                  <DragHandle label={label} isDisabled={!custom} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{label}</span>
                    <span className="truncate font-mono text-xs font-normal text-quanta-pigeon">
                      {[fieldKind(entry, fieldTypes.data), name]
                        .filter(Boolean)
                        .join(' · ')}
                      {required && ` · ${t(messages.required).toLowerCase()}`}
                    </span>
                  </span>
                  <span
                    className={`
                      shrink-0 rounded-full px-2 py-0.5 text-xs font-normal
                      ${
                        custom
                          ? 'bg-quanta-snow text-quanta-space'
                          : 'border border-quanta-smoke text-quanta-pigeon'
                      }
                    `}
                  >
                    {custom
                      ? t(messages.custom)
                      : behaviorTitle(entry.behavior)}
                  </span>
                </GridListItem>
              );
            }}
          </GridList>
          {canRemoveFieldset(fieldset) && (
            <div>
              <Button
                variant="destructive"
                onPress={() => {
                  field.onChange(removeFieldset(schema, fieldset.id));
                  setSelected('default');
                }}
              >
                {t(messages.deleteFieldset)}
              </Button>
            </div>
          )}
          <p className="text-sm text-quanta-pigeon">
            {t(messages.lockedFieldsHelp)} {t(messages.reorderHelp)}
          </p>
        </div>
      </div>

      <FieldEditor
        schema={schema}
        field={editing}
        onChange={field.onChange}
        onClose={() => setEditing(null)}
        fieldTypes={fieldTypes.data}
      />
      <AddFieldDialog
        isOpen={isAddingField}
        onOpenChange={setIsAddingField}
        schema={schema}
        fieldset={holdsCustomFields(fieldset) ? fieldset.id : 'default'}
        fieldTypes={fieldTypes.data}
        fieldTypesError={!!fieldTypes.error}
        onAdd={(next, added) => {
          field.onChange(next);
          const target = next.fieldsets.find((entry) =>
            entry.fields.includes(added),
          );
          if (target) setSelected(target.id);
        }}
      />
      <AddFieldsetDialog
        isOpen={isAddingFieldset}
        onOpenChange={setIsAddingFieldset}
        schema={schema}
        onAdd={(next, added) => {
          field.onChange(next);
          setSelected(added);
        }}
      />
    </div>
  );
}
