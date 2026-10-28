import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  Heading,
  Modal,
  SearchField,
  Switch,
} from '@plone/quanta';
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

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Dialog className="mx-auto flex max-h-[85vh] w-full flex-col gap-4 p-8">
        <Heading slot="title" className="text-xl font-semibold">
          {t(messages.addBehaviorsTitle, { title })}
        </Heading>
        <div className="flex flex-wrap items-end gap-4">
          <SearchField
            aria-label={t(messages.searchBehaviors)}
            placeholder={t(messages.searchBehaviors)}
            value={search}
            onChange={setSearch}
            autoFocus
            className="min-w-60 flex-1"
          />
          <Switch isSelected={showDeprecated} onChange={setShowDeprecated}>
            {t(messages.showDeprecated)}
          </Switch>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto pr-1">
          {groups.length === 0 && (
            <p className="text-sm text-quanta-pigeon">
              {t(messages.noMatchingBehaviors)}
            </p>
          )}
          {groups.map(({ group, items }) => (
            <section
              key={group}
              aria-labelledby={`behavior-group-${group}`}
              className="flex flex-col gap-2"
            >
              <h3
                id={`behavior-group-${group}`}
                className="text-xs font-semibold tracking-wide text-quanta-pigeon uppercase"
              >
                {GROUP_TITLES[group] ? t(GROUP_TITLES[group]) : group}
              </h3>
              {items.map((behavior) => {
                const isSelected = selected.includes(behavior.name);
                const blocked = isSelected
                  ? undefined
                  : blockedBecause(behavior.name);
                return (
                  <Checkbox
                    key={behavior.name}
                    isSelected={isSelected}
                    isDisabled={!!blocked}
                    onChange={(checked) =>
                      setSelected((current) =>
                        checked
                          ? [...current, behavior.name]
                          : current.filter((name) => name !== behavior.name),
                      )
                    }
                    description={blocked ?? describe(behavior)}
                  >
                    {behavior.title}
                  </Checkbox>
                );
              })}
            </section>
          ))}
        </div>
        <p className="text-sm text-quanta-pigeon">
          {t(
            capabilities.behaviorOrder
              ? messages.newBehaviorsAtEndMovable
              : messages.newBehaviorsAtEnd,
          )}
        </p>
        <div className="flex justify-end gap-2">
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
      </Dialog>
    </Modal>
  );
}
