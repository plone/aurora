import { Menu, MenuItem, MenuSection, SubmenuTrigger } from '@plone/quanta';
import { useTranslation } from 'react-i18next';

interface Props {
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

const sortOrders = [
  { id: 'ascending', label: 'contents.rearrange.asc' },
  { id: 'descending', label: 'contents.rearrange.desc' },
] as const;

const itemClassName = 'border-b-0 py-1.5 text-quanta-space';

/**
 * The menu to rearrange the items of the folder permanently, by an index and
 * an order. Render it inside a `MenuTrigger`, which places it in a popover.
 */
export function RearrangePopover({ indexes, sortItems }: Props) {
  const { t } = useTranslation();

  return (
    <Menu aria-label={t('contents.rearrange.by')} className="min-w-48 px-1.5">
      {sortOrders.map((order) => (
        <SubmenuTrigger key={order.id}>
          <MenuItem id={order.id} className={itemClassName}>
            {t(order.label)}
          </MenuItem>
          <Menu
            aria-label={t('contents.rearrange.by')}
            className="min-w-48 px-1.5"
            onAction={(id) => sortItems(id.toString())}
          >
            <MenuSection title={t('contents.rearrange.permanently_by')}>
              {sortIndexes.map((index) => (
                <MenuItem
                  key={index}
                  id={`${indexes[index].sort_on}|${order.id}`}
                  className={itemClassName}
                >
                  {t(indexes[index].label)}
                </MenuItem>
              ))}
            </MenuSection>
          </Menu>
        </SubmenuTrigger>
      ))}
    </Menu>
  );
}
