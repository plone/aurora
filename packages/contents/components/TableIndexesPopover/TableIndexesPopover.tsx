import { Checkbox, Dialog, Popover } from '@plone/quanta';
import { useTranslation } from 'react-i18next';
import type { TableIndexes } from '../../types';

interface Props {
  indexes: TableIndexes;
  onSelectIndex: (index: string) => void;
}

export const TableIndexesPopover = ({ indexes, onSelectIndex }: Props) => {
  const { t } = useTranslation();

  return (
    <Popover placement="bottom end" className="table-indexes-popover w-48">
      <Dialog
        aria-labelledby="table-indexes-label"
        className="max-h-60 overflow-auto px-3 py-2 outline-hidden"
      >
        <p
          id="table-indexes-label"
          className="mb-1 text-xs leading-[18px] text-quanta-pigeon"
        >
          {t('contents.indexes.select_columns')}
        </p>
        <ul className="flex flex-col">
          {indexes.order.map((index) => {
            if (index === 'sortable_title') return null;
            return (
              <li key={index} className="py-1">
                <Checkbox
                  value={index}
                  isSelected={indexes.values[index].selected}
                  onChange={() => {
                    onSelectIndex(index);
                  }}
                  slot={null}
                  className="text-sm text-quanta-space"
                >
                  {t(indexes.values[index].label)}
                </Checkbox>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </Popover>
  );
};
