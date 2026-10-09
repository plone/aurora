import { useMemo } from 'react';
import type { FormWidgetProps } from '@plone/types';
import { Select, type SelectItemObject } from '@plone/quanta';
import { useTranslation } from 'react-i18next';
import { termOption, useChoices, type TermValue } from '../Form/useChoices';

/**
 * The widget reads a token, or a term as the content API sends it, and
 * writes a token.
 */
export type SelectWidgetProps = FormWidgetProps<TermValue | null>;

// The key of the "no value" option.
const NO_VALUE = '--NOVALUE--';

/**
 * Adapts the widget contract to the Quanta `Select` control, for a field
 * with `choices` or a vocabulary. The value is the token of the chosen
 * option, or `null`.
 */
export function SelectWidget({
  name,
  value,
  onChange,
  onBlur,
  label,
  description,
  placeholder,
  required,
  disabled,
  readOnly,
  invalid,
  errorMessage,
  className,
  choices,
  vocabulary,
  widgetOptions,
}: SelectWidgetProps) {
  const { t } = useTranslation();
  const { options } = useChoices({
    choices,
    vocabulary: vocabulary ?? widgetOptions?.vocabulary,
  });

  // The content API can send the value of a choice as a term object, or as
  // another type than its token, such as `true` for the token `True`.
  const term = termOption(value);
  const stored = term?.value ?? null;
  const selected =
    stored === null
      ? null
      : (options.find((option) => option.value === stored)?.value ??
        options.find(
          (option) => option.value.toLowerCase() === stored.toLowerCase(),
        )?.value ??
        stored);

  const items = useMemo(() => {
    const list: SelectItemObject[] = [...options];
    // The stored value stays selected while the vocabulary loads, or when
    // it's no longer one of the options.
    if (selected && !list.some((item) => item.value === selected)) {
      list.unshift({ value: selected, label: term?.label ?? selected });
    }
    // An optional field can be emptied.
    if (!required) {
      list.unshift({
        value: NO_VALUE,
        label: t('cmsui.widgets.select.noValue'),
      });
    }
    return list;
  }, [options, selected, term?.label, required, t]);

  return (
    <Select
      name={name}
      items={items}
      value={selected}
      onChange={(key) =>
        onChange(key == null || key === NO_VALUE ? null : String(key))
      }
      onBlur={onBlur}
      label={label}
      description={description}
      placeholder={placeholder ?? t('cmsui.widgets.select.placeholder')}
      isRequired={required}
      // A select can't be read-only: it is disabled instead.
      isDisabled={disabled || readOnly}
      isInvalid={invalid}
      errorMessage={errorMessage}
      // Validation is the form's job, not the browser's.
      validationBehavior="aria"
      className={className}
    />
  );
}

SelectWidget.displayName = 'SelectWidget';
