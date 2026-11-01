import { useEffect, useState } from 'react';
import {
  Button as RACButton,
  GridList,
  GridListHeader,
  GridListItem,
  GridListSection,
  type Selection,
} from 'react-aria-components';
import {
  Button,
  Dialog,
  Heading,
  Modal,
  SearchField,
  Switch,
} from '@plone/quanta';
import { CheckboxIcon, CloseIcon, DashIcon } from '@plone/icons';
import { useTranslate } from '../../../provider/ControlPanelsProvider';
import type { Message } from '../../../provider/messages';
import {
  enabledAlternative,
  includedBy,
  includes,
} from '../../behaviorEditing';
import { BEHAVIOR_GROUPS } from '../../behaviorMetadata';
import { useBehaviorMetadata, useContentTypesDriver } from '../../driver';
import { messages } from '../../messages';
import type { BehaviorInfo } from '../../types';

export interface AddBehaviorsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** The type's title. */
  title: string;
  /** Every behavior that can be enabled. */
  behaviors: BehaviorInfo[];
  /** The type's behaviors, with unsaved changes. */
  enabled: string[];
  /** Called with the behaviors to add, in the order they're listed. */
  onAdd: (names: string[]) => void;
}

const GROUP_TITLES: Record<string, Message> = {
  content: messages.groupContent,
  metadata: messages.groupMetadata,
  event: messages.groupEvent,
  layout: messages.groupLayout,
  navigation: messages.groupNavigation,
  naming: messages.groupNaming,
  features: messages.groupFeatures,
  other: messages.groupOther,
};

/**
 * The dialog that adds behaviors to a type, grouped and searchable. It says
 * why a behavior can't be added: another one already contains it, or it's
 * the other way of doing what an enabled one does.
 */
export function AddBehaviorsDialog({
  isOpen,
  onOpenChange,
  title,
  behaviors,
  enabled,
  onAdd,
}: AddBehaviorsDialogProps) {
  const t = useTranslate();
  const metadata = useBehaviorMetadata();
  const { capabilities } = useContentTypesDriver();
  const [search, setSearch] = useState('');
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setShowDeprecated(false);
    setSelected([]);
  }, [isOpen]);

  const titleOf = (name: string) =>
    behaviors.find((behavior) => behavior.name === name)?.title ?? name;
  const query = search.trim().toLowerCase();
  const available = behaviors.filter(
    ({ name, title: behaviorTitle, description }) =>
      !enabled.includes(name) &&
      (showDeprecated || !metadata[name]?.deprecated) &&
      (!query ||
        [name, behaviorTitle, description ?? ''].some((text) =>
          text.toLowerCase().includes(query),
        )),
  );
  const groupOf = (name: string) => metadata[name]?.group ?? 'other';
  const groups = [
    ...BEHAVIOR_GROUPS,
    ...new Set(
      available
        .map(({ name }) => groupOf(name))
        .filter(
          (group) => !(BEHAVIOR_GROUPS as readonly string[]).includes(group),
        ),
    ),
  ]
    .map((group) => ({
      group,
      items: available.filter(({ name }) => groupOf(name) === group),
    }))
    .filter(({ items }) => items.length > 0);

  // What would be on with the selection, to explain overlaps within it too.
  const withSelection = [...enabled, ...selected];
  const blockedBecause = (name: string) => {
    const container = includedBy(name, withSelection, metadata);
    if (container) return t(messages.includedIn, { title: titleOf(container) });
    const alternative = enabledAlternative(name, withSelection, metadata);
    if (alternative)
      return t(messages.instead, { title: titleOf(alternative) });
    const parts = includes(name, withSelection, metadata);
    if (parts.length) {
      return t(messages.containsEnabled, {
        behaviors: parts.map(titleOf).join(', '),
      });
    }
    return undefined;
  };
  const describe = (behavior: BehaviorInfo) => {
    const entry = metadata[behavior.name];
    if (entry?.deprecated) {
      return entry.replacement
        ? t(messages.deprecatedUse, { title: titleOf(entry.replacement) })
        : t(messages.deprecated);
    }
    return behavior.description;
  };

  const setSelection = (keys: Selection) => {
    const names =
      keys === 'all'
        ? available.map(({ name }) => name)
        : [...keys].map(String);
    // Keep the order they were picked in.
    setSelected((current) => [
      ...current.filter((name) => names.includes(name)),
      ...names.filter((name) => !current.includes(name)),
    ]);
  };
  const disabledKeys = available
    .filter(({ name }) => !selected.includes(name) && blockedBecause(name))
    .map(({ name }) => name);
  const fieldsKnown = (behavior: BehaviorInfo) =>
    behavior.fieldsets !== undefined;
  const addsNoFields = (behavior: BehaviorInfo) =>
    fieldsKnown(behavior) &&
    behavior.fieldsets!.every((fieldset) => fieldset.fields.length === 0);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Dialog className="flex h-[min(85vh,760px)] w-full flex-col gap-4 p-0">
        <div className="flex flex-col gap-4 px-7 pt-6">
          <Heading slot="title" className="text-xl font-semibold">
            {t(messages.addBehaviorsTitle, { title })}
          </Heading>
          <div className="flex flex-wrap items-center gap-4">
            <SearchField
              aria-label={t(messages.searchBehaviors)}
              placeholder={t(messages.searchBehaviorsHint)}
              value={search}
              onChange={setSearch}
              autoFocus
              className="min-w-60 flex-1"
            />
            <Switch isSelected={showDeprecated} onChange={setShowDeprecated}>
              {t(messages.showDeprecated)}
            </Switch>
          </div>
        </div>
        <GridList
          aria-label={t(messages.addBehaviorsTitle, { title })}
          selectionMode="multiple"
          selectionBehavior="toggle"
          selectedKeys={selected}
          onSelectionChange={setSelection}
          disabledKeys={disabledKeys}
          // Blocked behaviors stay focusable, so their reason can be read.
          disabledBehavior="selection"
          renderEmptyState={() => (
            <p className="px-3 py-6 text-sm text-quanta-pigeon">
              {t(messages.noMatchingBehaviors)}
            </p>
          )}
          className="min-h-0 flex-1 overflow-auto px-4 pb-4 outline-none"
        >
          {groups.map(({ group, items }) => (
            <GridListSection key={group} className="flex flex-col gap-0.5 pb-3">
              <GridListHeader
                className={`
                  sticky top-0 z-10 bg-quanta-air px-3 pt-2 pb-1.5 text-xs font-semibold
                  tracking-wide text-quanta-pigeon uppercase
                `}
              >
                {GROUP_TITLES[group] ? t(GROUP_TITLES[group]) : group}
              </GridListHeader>
              {items.map((behavior) => {
                const isSelected = selected.includes(behavior.name);
                const blocked = isSelected
                  ? undefined
                  : blockedBecause(behavior.name);
                const description = blocked ?? describe(behavior);
                return (
                  <GridListItem
                    key={behavior.name}
                    id={behavior.name}
                    textValue={behavior.title}
                    className={({ isFocusVisible }) => `
                      group grid cursor-pointer grid-cols-[20px_minmax(0,1fr)] items-start gap-3
                      rounded-lg border px-3 py-2.5 outline-none
                      ${
                        isSelected
                          ? 'border-quanta-sky bg-quanta-arctic'
                          : blocked
                            ? 'cursor-not-allowed border-transparent'
                            : 'border-transparent hover:bg-quanta-snow'
                      }
                      ${isFocusVisible ? 'ring-2 ring-quanta-cobalt' : ''}
                    `}
                  >
                    <span
                      aria-hidden
                      className={`
                        mt-0.5 flex size-5 items-center justify-center rounded-md border-[1.5px]
                        ${
                          isSelected
                            ? 'border-quanta-sapphire bg-quanta-sapphire text-quanta-air'
                            : blocked
                              ? `
                                border-dashed border-quanta-silver bg-quanta-snow text-quanta-pigeon
                              `
                              : 'border-quanta-silver bg-quanta-air'
                        }
                      `}
                    >
                      {isSelected && <CheckboxIcon size="xs" />}
                      {blocked && <DashIcon size="xs" />}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span
                          className={`
                            text-[15px] font-semibold
                            ${blocked ? 'text-quanta-pigeon' : 'text-quanta-space'}
                          `}
                        >
                          <Highlight text={behavior.title} query={query} />
                        </span>
                        <code
                          className={`
                            rounded-sm border border-quanta-smoke bg-quanta-snow px-1.5 font-mono
                            text-xs text-quanta-iron
                          `}
                        >
                          <Highlight text={behavior.name} query={query} />
                        </code>
                      </span>
                      {(description || addsNoFields(behavior)) && (
                        <span className="text-[13px] leading-snug text-quanta-iron">
                          {description}
                          {!blocked && addsNoFields(behavior) && (
                            <>
                              {description ? ' ' : ''}
                              {t(messages.addsNoFields)}
                            </>
                          )}
                        </span>
                      )}
                    </span>
                  </GridListItem>
                );
              })}
            </GridListSection>
          ))}
        </GridList>
        <div className="flex flex-col gap-3 border-t border-quanta-smoke px-7 pt-3.5 pb-5">
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[13px] text-quanta-iron">
                {t(messages.behaviorsToAdd)}
              </span>
              {selected.map((name) => (
                <RACButton
                  key={name}
                  aria-label={t(messages.removeBehavior, {
                    title: titleOf(name),
                  })}
                  onPress={() =>
                    setSelected((current) =>
                      current.filter((other) => other !== name),
                    )
                  }
                  className={`
                    inline-flex cursor-pointer items-center gap-1 rounded-full bg-quanta-arctic py-1
                    pr-1.5 pl-2.5 text-[13px] text-quanta-royal outline-none
                    hover:bg-quanta-sky/40
                    focus-visible:ring-2 focus-visible:ring-quanta-cobalt
                  `}
                >
                  {titleOf(name)}
                  <CloseIcon size="xs" />
                </RACButton>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-quanta-pigeon">
              {t(
                capabilities.behaviorOrder
                  ? messages.newBehaviorsAtEndMovable
                  : messages.newBehaviorsAtEnd,
              )}
            </p>
            <div className="flex gap-2">
              <Button onPress={() => onOpenChange(false)}>
                {t(messages.cancel)}
              </Button>
              <Button
                variant="primary"
                accent
                isDisabled={selected.length === 0}
                onPress={() => {
                  onAdd(selected);
                  onOpenChange(false);
                }}
              >
                {selected.length
                  ? t(messages.addSelected, { count: selected.length })
                  : t(messages.add)}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

/** The text, with the part that matches the search marked. */
function Highlight({ text, query }: { text: string; query: string }) {
  const start = query ? text.toLowerCase().indexOf(query) : -1;
  if (start < 0) return <>{text}</>;
  const end = start + query.length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-xs bg-quanta-banana text-inherit">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}
