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
} from '../editor/plugins/slash-menu';

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

  const groups = React.useMemo(() => {
    return resolveSlashMenuGroups(editor, menuConfig, {
      hasTitleBlock,
      t,
    });
  }, [editor, hasTitleBlock, menuConfig, t]);

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

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
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
