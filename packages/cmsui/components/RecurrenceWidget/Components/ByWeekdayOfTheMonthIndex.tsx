import { Select } from '@plone/quanta';

import { getOrdinalNumbersOptions, ORDINAL_NUMBERS } from '../utils';
import { useTranslation } from 'react-i18next';

interface ByWeekdayOfTheMonthIndexProps {
  onChange: (value: number) => void;
  defaultValue: keyof typeof ORDINAL_NUMBERS;
}

const ByWeekdayOfTheMonthIndex = ({
  onChange,
  defaultValue,
}: ByWeekdayOfTheMonthIndexProps) => {
  const { t } = useTranslation();
  return (
    <Select
      onChange={(value) => {
        const indexValue = Number(value);
        onChange(indexValue);
      }}
      defaultValue={Number(defaultValue)}
      items={getOrdinalNumbersOptions(t)}
    />
  );
};

export default ByWeekdayOfTheMonthIndex;
