import { Menu, MenuItem, SubmenuTrigger } from 'react-aria-components';
import { Dialog, Popover, type PopoverProps } from '@plone/quanta';
import ChevronrightIcon from '@plone/icons/svg/chevron-right.svg?react';
import { useTranslation } from 'react-i18next';
import './RearrangePopover.css';

interface Props extends Omit<PopoverProps, 'children'> {
  indexes: {
    [index: string]: {
      label: string;
      sort_on?: string;
    };
  };
  sortItems: (index: string) => void;
}

const sortIndexes = [
  // TODO "id" is a reserved key for table rows, so we cannot add the "ID" column at this time
  // 'id',
  'sortable_title',
  'EffectiveDate',
  'CreationDate',
  'ModificationDate',
  'portal_type',
];

interface MenuItem {
  id: string;
  name: string;
  children?: MenuItem[];
}

export function RearrangePopover({
  indexes,
  sortItems,
  ...popoverProps
}: Props) {
  const { t } = useTranslation();

  const menuItems: MenuItem[] = sortIndexes.map((index) => ({
    id: index,
    name: t(indexes[index].label),
    children: [
      {
        id: `${indexes[index].sort_on}|ascending`,
        name: t('contents.rearrange.asc'),
      },
      {
        id: `${indexes[index].sort_on}|descending`,
        name: t('contents.rearrange.desc'),
      },
    ],
  }));

  return (
    <Popover
      {...popoverProps}
      className="q react-aria-Popover rearrange-popover"
    >
      <Dialog
        aria-labelledby="rearrange-popover-label"
        className="[[data-placement]>&]:p-3"
      >
        <fieldset>
          <legend id="rearrange-popover-label">
            {t('contents.rearrange.by')}
          </legend>

          <Menu items={menuItems}>
            {function renderSubmenu(item) {
              if (item.children) {
                return (
                  <SubmenuTrigger delay={100}>
                    <MenuItem
                      key={item.id}
                      textValue={item.name}
                      className={({ isFocused, isOpen }) =>
                        `react-aria-MenuItem rearrange-menu-item ${
                          isFocused ? 'focused' : ''
                        } ${isOpen ? 'open' : ''}`
                      }
                    >
                      {({ hasSubmenu }) => (
                        <>
                          {item.name}
                          {hasSubmenu && <ChevronrightIcon size="xs" />}
                        </>
                      )}
                    </MenuItem>
                    <Popover className="q react-aria-Popover rearrange-popover">
                      <Dialog
                        className="[[data-placement]>&]:p-3"
                        aria-label={t('contents.rearrange.pickOrder', {
                          index: item.name,
                        })}
                      >
                        <fieldset>
                          <legend>
                            {t('contents.rearrange.pickOrder', {
                              index: item.name,
                            })}
                          </legend>
                          <Menu
                            items={item.children}
                            onAction={(id) => {
                              sortItems(id.toString());
                            }}
                          >
                            {(item) => renderSubmenu(item)}
                          </Menu>
                        </fieldset>
                      </Dialog>
                    </Popover>
                  </SubmenuTrigger>
                );
              } else {
                return <MenuItem key={item.id}>{item.name}</MenuItem>;
              }
            }}
          </Menu>
        </fieldset>
      </Dialog>
    </Popover>
  );
}
