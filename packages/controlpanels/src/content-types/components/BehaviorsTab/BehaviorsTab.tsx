import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { GridList, GridListItem, useDragAndDrop } from 'react-aria-components';
import { useSchemaField } from '@plone/helpers';
import { Button, ToggleButton, ToggleButtonGroup } from '@plone/quanta';
import { BinIcon } from '@plone/icons';
import {
  useNotify,
  useTranslate,
} from '../../../provider/ControlPanelsProvider';
import {
  addsFields,
  behaviorFields,
  estimateFormPreview,
  moveBehaviors,
  replaceBehavior,
  shiftBehavior,
  type BehaviorContext,
} from '../../behaviorEditing';
import { useBehaviorMetadata, useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import type { BehaviorInfo, TypeSchema } from '../../types';
import {
  DragHandle,
  listStyles,
  renderDropIndicator,
  rowStyles,
} from '../reorderableList';
import { AddBehaviorsDialog } from './AddBehaviorsDialog';
import { FormPreview } from './FormPreview';

export interface BehaviorsTabProps {
  /** The type's short name, for the backend's form preview. */
  typeId: string;
  /** The type's title. */
  title: string;
  /** Every behavior that can be enabled. */
  behaviors: BehaviorInfo[];
  /** The saved schema, which tells what the saved behaviors add. */
  schema?: TypeSchema;
  /** The saved behaviors. */
  saved: string[];
}

/** The backend's preview of the edit form, while the list differs. */
function useBackendPreview(
  typeId: string,
  enabled: string[],
  saved: string[],
  schema: TypeSchema | undefined,
) {
  const driver = useContentTypesDriver();
  const canPreview =
    driver.capabilities.schemaPreview && !!driver.previewSchema;
  const isSaved = enabled.join('\n') === saved.join('\n');
  const key = enabled.join('\n');
  const [preview, setPreview] = useState<{ key: string; schema: TypeSchema }>();

  useEffect(() => {
    if (!canPreview || isSaved) return;
    let current = true;
    // Wait for a pause, so dragging doesn't ask on every move.
    const timer = setTimeout(() => {
      driver.previewSchema!(typeId, key.split('\n').filter(Boolean))
        .then((next) => current && setPreview({ key, schema: next }))
        .catch(() => {});
    }, 300);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [canPreview, isSaved, driver, typeId, key]);

  if (!canPreview) return undefined;
  if (isSaved) return { schema, isUpdating: false };
  return {
    schema: preview?.schema ?? schema,
    isUpdating: preview?.key !== key,
  };
}

/**
 * A type's behaviors: the ones that add fields as an ordered list, since
 * their order sets where their fields appear, and the ones that only add a
 * feature as a compact group. A preview shows the edit form as it would be.
 * Changes go into the page's form, and are saved with the rest of the type.
 */
export function BehaviorsTab({
  typeId,
  title,
  behaviors,
  schema,
  saved,
}: BehaviorsTabProps) {
  const t = useTranslate();
  const notify = useNotify();
  const { capabilities } = useContentTypesDriver();
  const metadata = useBehaviorMetadata();
  const field = useSchemaField<string[]>('behaviors');
  const enabled = useMemo(() => field.value ?? [], [field.value]);
  const [isAdding, setIsAdding] = useState(false);
  const [highlight, setHighlight] = useState<string>();

  const context: BehaviorContext = { behaviors, schema, saved, metadata };
  const info = (name: string) =>
    behaviors.find((behavior) => behavior.name === name);
  const titleOf = (name: string) => info(name)?.title ?? name;
  const withFields = enabled.filter((name) => addsFields(name, context));
  const features = enabled.filter((name) => !withFields.includes(name));

  const backend = useBackendPreview(typeId, enabled, saved, schema);
  const estimate = useMemo(
    () => estimateFormPreview(enabled, { behaviors, schema, saved, metadata }),
    [enabled, behaviors, schema, saved, metadata],
  );
  const previewSchema = backend?.schema ?? estimate.schema;

  const fieldTitles = (name: string) => {
    const fields = behaviorFields(name, context);
    if (!fields) return undefined;
    return fields.map(
      (field) =>
        previewSchema.properties[field]?.title ||
        schema?.properties[field]?.title ||
        field,
    );
  };

  const remove = (name: string) => {
    field.onChange(enabled.filter((entry) => entry !== name));
    const count = behaviorFields(name, context)?.length ?? 0;
    notify({
      title: t(messages.behaviorRemoved, { title: titleOf(name) }),
      description:
        count === 0
          ? undefined
          : count === 1
            ? t(messages.behaviorRemovedField)
            : t(messages.behaviorRemovedFields, { count }),
    });
  };

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: ({ keys, target }) => {
      if (target.dropPosition === 'on') return;
      field.onChange(
        moveBehaviors(
          enabled,
          [...keys].map(String),
          String(target.key),
          target.dropPosition,
        ),
      );
    },
    renderDropIndicator,
  });

  // Alt + ↑/↓ moves the focused row, as in the design.
  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!capabilities.behaviorOrder || !event.altKey) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const row = (event.target as HTMLElement).closest<HTMLElement>(
      '[role="row"][data-key]',
    );
    const name = row?.dataset.key;
    if (!name) return;
    event.preventDefault();
    event.stopPropagation();
    field.onChange(
      shiftBehavior(enabled, name, event.key === 'ArrowUp' ? -1 : 1, (other) =>
        withFields.includes(other),
      ),
    );
  };

  const variants = (name: string) => {
    const alternatives = (metadata[name]?.alternatives ?? []).filter(
      (other) => info(other) && !enabled.includes(other),
    );
    if (!alternatives.length) return null;
    return (
      <ToggleButtonGroup
        aria-label={t(messages.behaviorVariant, { title: titleOf(name) })}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[name]}
        className="self-start"
        onSelectionChange={(keys) => {
          const [next] = [...keys].map(String);
          if (next && next !== name) {
            field.onChange(replaceBehavior(enabled, name, next));
          }
        }}
      >
        {[name, ...alternatives].map((option) => (
          <ToggleButton key={option} id={option}>
            {titleOf(option)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  };

  const removeButton = (name: string) => (
    <Button
      aria-label={t(messages.removeBehavior, { title: titleOf(name) })}
      onPress={() => remove(name)}
    >
      <BinIcon size="sm" />
    </Button>
  );

  const included = (name: string) => {
    const parts = metadata[name]?.includes ?? [];
    return parts.length
      ? t(messages.includesList, { behaviors: parts.map(titleOf).join(', ') })
      : undefined;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-quanta-pigeon">
          {t(messages.behaviorsSummary, {
            on: enabled.length,
            withFields: withFields.length,
            features: features.length,
          })}
        </p>
        <Button variant="primary" accent onPress={() => setIsAdding(true)}>
          {t(messages.addBehaviors)}
        </Button>
      </div>

      <div
        className={`
          grid gap-6
          lg:grid-cols-[minmax(0,1.6fr)_minmax(15rem,1fr)]
        `}
      >
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-labelledby="form-behaviors"
            className="flex flex-col gap-2"
          >
            <h3 id="form-behaviors" className="text-sm font-semibold">
              {t(messages.formBehaviors)}
            </h3>
            <p className="text-sm text-quanta-pigeon">
              {t(messages.formBehaviorsHelp)}{' '}
              {t(
                capabilities.behaviorOrder
                  ? messages.formBehaviorsReorderHelp
                  : messages.formBehaviorsFixedOrder,
              )}
            </p>
            <div onKeyDownCapture={onKeyDownCapture}>
              <GridList
                aria-label={t(messages.formBehaviors)}
                items={withFields.map((name) => ({ name }))}
                dependencies={[enabled, previewSchema]}
                dragAndDropHooks={
                  capabilities.behaviorOrder ? dragAndDropHooks : undefined
                }
                renderEmptyState={() => (
                  <p className="px-3 py-4 text-sm text-quanta-pigeon">
                    {t(messages.noFormBehaviors)}
                  </p>
                )}
                className={listStyles}
              >
                {({ name }) => {
                  const fields = fieldTitles(name);
                  const extra = included(name);
                  return (
                    <GridListItem
                      id={name}
                      textValue={titleOf(name)}
                      className={(state) => `${rowStyles(state)} items-start`}
                    >
                      {({ allowsDragging }) => (
                        <div
                          className="flex min-w-0 flex-1 items-start gap-3"
                          onMouseEnter={() => setHighlight(name)}
                          onMouseLeave={() => setHighlight(undefined)}
                          onFocus={() => setHighlight(name)}
                          onBlur={() => setHighlight(undefined)}
                        >
                          <span
                            className={`
                              w-5 shrink-0 pt-0.5 text-right font-mono text-xs text-quanta-pigeon
                            `}
                          >
                            {withFields.indexOf(name) + 1}
                          </span>
                          {allowsDragging && (
                            <DragHandle label={titleOf(name)} />
                          )}
                          <span className="flex min-w-0 flex-1 flex-col gap-1 font-normal">
                            <span className="font-semibold">
                              {titleOf(name)}
                            </span>
                            <span className="text-xs text-quanta-pigeon">
                              {fields?.length
                                ? t(messages.addsFieldsList, {
                                    fields: fields.join(', '),
                                  })
                                : t(messages.addsFieldsUnknown)}
                            </span>
                            {extra && (
                              <span className="text-xs text-quanta-pigeon">
                                {extra}
                              </span>
                            )}
                            {variants(name)}
                          </span>
                          {removeButton(name)}
                        </div>
                      )}
                    </GridListItem>
                  );
                }}
              </GridList>
            </div>
          </section>

          <section
            aria-labelledby="feature-behaviors"
            className="flex flex-col gap-2"
          >
            <h3 id="feature-behaviors" className="text-sm font-semibold">
              {t(messages.behaviorFeatures)}
            </h3>
            <p className="text-sm text-quanta-pigeon">
              {t(messages.behaviorFeaturesHelp)}
            </p>
            {features.length === 0 ? (
              <p className="text-sm text-quanta-pigeon">
                {t(messages.noFeatures)}
              </p>
            ) : (
              <ul
                aria-label={t(messages.behaviorFeatures)}
                className={`
                  grid gap-2
                  sm:grid-cols-2
                `}
              >
                {features.map((name) => (
                  <li
                    key={name}
                    className={`
                      flex items-start gap-2 rounded-lg border border-quanta-smoke p-3 text-sm
                    `}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-semibold">{titleOf(name)}</span>
                      {info(name)?.description && (
                        <span className="text-xs text-quanta-pigeon">
                          {info(name)?.description}
                        </span>
                      )}
                      {variants(name)}
                    </span>
                    {removeButton(name)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <FormPreview
          schema={previewSchema}
          highlight={highlight}
          pending={backend ? [] : estimate.pending.map(titleOf)}
          isEstimate={!backend && enabled.join() !== saved.join()}
          isUpdating={backend?.isUpdating}
          behaviorTitle={titleOf}
        />
      </div>

      <AddBehaviorsDialog
        isOpen={isAdding}
        onOpenChange={setIsAdding}
        title={title}
        behaviors={behaviors}
        enabled={enabled}
        onAdd={(names) => field.onChange([...enabled, ...names])}
      />
    </div>
  );
}
