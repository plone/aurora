import { DatePicker } from '@plone/quanta';
import type { Updater } from '@tanstack/react-form';
import { useFieldValue } from '@plone/helpers';

interface UntilEndFieldProps {
  onChange: (updater: Updater<string>) => void;
}

const UntilEndField = ({ onChange }: UntilEndFieldProps) => {
  const end = useFieldValue<string>('end');

  const endDate = new Date(end as string);
  const defaultYear = endDate.getFullYear();
  const defaultMonth = endDate.getMonth() + 1;
  const defaultDay = endDate.getDate();

  const today = new Date();

  const month = defaultMonth < 10 ? `0${defaultMonth}` : defaultMonth;

  const defaultDate = endDate
    ? `${defaultYear}-${month}-${defaultDay}`
    : `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  return (
    <DatePicker
      onChange={(value) => {
        if (value && new Date(value).getFullYear().toString().length === 4) {
          onChange(value);
        }
      }}
      defaultValue={defaultDate}
      className="**:dark:text-foreground"
      resettable={false}
    />
  );
};
export default UntilEndField;
