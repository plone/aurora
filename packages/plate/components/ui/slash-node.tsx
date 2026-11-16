import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { SlashPlugin } from '@platejs/slash-command/react';
import { type TComboboxInputElement, ElementApi } from 'platejs';
import { PlateElement } from 'platejs/react';
import { useTranslation } from '../editor/plugins/i18n';
import { TITLE_BLOCK_TYPE } from '../editor/plugins/title';
import {
  resolveSlashMenuGroups,
  type SlashMenuConfig,
  type SlashMenuContainer,
} from '../editor/plugins/slash-menu';
import {
  getAvailableInnerBlocks,
  getBlockContainers,
} from '../editor/plugins/containers';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const menuConfig = (
    editor.getOptions(SlashPlugin as any) as
      { menu?: SlashMenuConfig } | undefined
  )?.menu;
  const { t } = useTranslation();

  const hasTitleBlock = editor.children.some(
    (child) => ElementApi.isElement(child) && child.type === TITLE_BLOCK_TYPE,
  );

  // Inside a container, such as an accordion panel, the menu only offers
  // what the container can hold.
  const containers = getBlockContainers(editor, props.path);
  const closest = containers[0];
  const containerKey = containers
    .map((entry) => `${entry.spec.type}@${entry.slot[1].join('.')}`)
    .join('|');
  const container = React.useMemo<SlashMenuContainer | undefined>(
    () =>
      closest
        ? {
            type: closest.spec.type,
            availableBlocks: getAvailableInnerBlocks(
              editor,
              closest.spec,
              containers.slice(1),
            ),
          }
        : undefined,
    // The containers are read again when the menu moves to another one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, containerKey],
  );
  const nestingNote =
    closest && !closest.spec.nestable ? closest.spec.nestingNote?.(t) : '';

  // A control can open the menu without typing "/", which then isn't shown
  // or put back when the menu closes.
  const withoutTrigger =
    (element as { withoutTrigger?: boolean }).withoutTrigger === true;

  const noteId = React.useId();

  const groups = React.useMemo(() => {
    return resolveSlashMenuGroups(editor, menuConfig, {
      container,
      hasTitleBlock,
      t,
    });
  }, [container, editor, hasTitleBlock, menuConfig, t]);

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        element={element}
        trigger="/"
        restoreOnCancel={!withoutTrigger}
        showTrigger={!withoutTrigger}
      >
        <InlineComboboxInput
          {...(nestingNote ? { 'aria-describedby': noteId } : {})}
        />

        <InlineComboboxContent>
          <InlineComboboxEmpty>
            {t('plate.slashMenu.noResults', { defaultValue: 'No results' })}
          </InlineComboboxEmpty>

          {groups.map(({ group, label: groupLabel, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>
                {groupLabel ?? group}
              </InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                ),
              )}
            </InlineComboboxGroup>
          ))}
          {nestingNote && (
            <p
              id={noteId}
              className="border-t px-3 py-2 text-xs text-muted-foreground"
            >
              {nestingNote}
            </p>
          )}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
