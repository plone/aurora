import { useTranslation } from 'react-i18next';
import { Select } from '@plone/quanta';
import { getMonthOptions } from '../utils';

interface MonthOfTheYearFieldProps {
  onChange: (value: number) => void;
  defaultValue: number;
}

const MonthOfTheYearField = ({
  onChange,
  defaultValue,
}: MonthOfTheYearFieldProps) => {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;
  const months = getMonthOptions(currentLocale);
  return (
    <Select
      onChange={(value) =>
        value && typeof value === 'number' && onChange(value)
      }
      defaultValue={defaultValue}
      items={months}
    />
  );
};

export default MonthOfTheYearField;
