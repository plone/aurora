import { Checkbox, Dialog, Popover } from '@plone/quanta';
import { useTranslation } from 'react-i18next';
import PopoverListItem from '../PopoverListItem';
import type { TableIndexes } from '../../types';

interface Props {
  indexes: TableIndexes;
  onSelectIndex: (index: string) => void;
}

export const TableIndexesPopover = ({ indexes, onSelectIndex }: Props) => {
  const { t } = useTranslation();

  return (
    <Popover className="q react-aria-Popover table-indexes-popover">
      <Dialog
        aria-labelledby="table-indexes-label"
        className="[[data-placement]>&]:p-3"
      >
        <fieldset>
          <legend id="table-indexes-label">
            {t('contents.indexes.select_columns')}
          </legend>

          <ul className="popover-list">
            {indexes.order.map((index) => {
              if (index === 'sortable_title') return null;
              return (
                <PopoverListItem
                  key={index}
                  ariaDescribedby="table-indexes-label"
                >
                  <Checkbox
                    value={index}
                    isSelected={indexes.values[index].selected}
                    onChange={() => {
                      onSelectIndex(index);
                    }}
                    slot={null}
                    className="text-base"
                  >
                    {t(indexes.values[index].label)}
                  </Checkbox>
                </PopoverListItem>
              );
            })}
          </ul>
        </fieldset>
      </Dialog>
    </Popover>
  );
};
