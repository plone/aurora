import { DatePicker } from '@plone/quanta';
import { useFieldValue } from '@plone/helpers';

const pad = (value: number) => String(value).padStart(2, '0');

/** Formats a date as `YYYY-MM-DD`, in local time. */
export const toISODate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

interface UntilEndFieldProps {
  onChange: (value: string) => void;
}

const UntilEndField = ({ onChange }: UntilEndFieldProps) => {
  const end = useFieldValue<string>('end');

  // The event's end date, or today without one, as an ISO date (YYYY-MM-DD).
  const endDate = end ? new Date(end) : new Date();
  const defaultDate = toISODate(
    Number.isNaN(endDate.getTime()) ? new Date() : endDate,
  );

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
