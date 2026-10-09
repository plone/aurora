import { Select } from '@plone/quanta';
import { getDaysOptions } from '../utils';
import { useTranslation } from 'react-i18next';

interface ByWeekdayOfTheMonth {
  onChange: (value: number) => void;
  defaultValue: number;
}

const ByWeekdayOfTheMonth = ({
  onChange,
  defaultValue,
}: ByWeekdayOfTheMonth) => {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;
  const daysOptions = getDaysOptions(currentLocale);
  return (
    <Select
      onChange={(value) =>
        value && typeof value === 'number' && onChange(value)
      }
      defaultValue={defaultValue}
      items={daysOptions}
    />
  );
};

export default ByWeekdayOfTheMonth;
