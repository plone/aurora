import { useEffect, useMemo, useRef, useState } from 'react';
import type { FieldSchema, FormWidgetProps } from '@plone/types';
import { MultiSelect, type MultiSelectItem } from '@plone/quanta';
import { useTranslation } from 'react-i18next';
import { termOption, useChoices, type TermValue } from '../Form/useChoices';

/**
 * The widget reads a list of tokens, or of terms as the content API sends
 * them, and writes a list of tokens.
 */
export type ArrayWidgetProps = FormWidgetProps<TermValue[] | null>;

/** Waits until the editor stops typing before searching the vocabulary. */
function useDebouncedValue(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

/**
 * Adapts the widget contract to the Quanta `MultiSelect` control, for a list
 * of strings, such as the tags of a page. The value is the list of tokens.
 *
 * The editor types to add a token, and removes one from the list of tags.
 * The schema's `items` can restrict the tokens to their `choices` or
 * `vocabulary`. A vocabulary in the widget options, like the keywords of
 * `subjects`, only suggests tokens: the editor can still add new ones.
 */
export function ArrayWidget({
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
  schema,
  widgetOptions,
}: ArrayWidgetProps) {
  const { t } = useTranslation();
  const terms = useMemo(
    () =>
      (Array.isArray(value) ? value : [])
        .map(termOption)
        .filter((term) => term !== null),
    [value],
  );
  const tokens = useMemo(() => terms.map((term) => term.value), [terms]);
  const items = schema?.items as FieldSchema | undefined;
  const choices = items?.choices;
  const vocabulary = items?.vocabulary ?? widgetOptions?.vocabulary;
  // The items' choices or vocabulary are the only valid tokens.
  const creatable = !choices && !items?.vocabulary;

  const [input, setInput] = useState('');
  const title = useDebouncedValue(input.trim());
  const { options } = useChoices({
    choices,
    vocabulary,
    // Suggestions only: the content API's first batch of the terms that
    // match what the editor types.
    title: title || undefined,
  });

  // The labels of the tokens, kept while the options change with the search.
  const labels = useRef(new Map<string, string>());
  [...terms, ...options].forEach((option) =>
    labels.current.set(option.value, option.label),
  );

  const suggestions = useMemo<MultiSelectItem[]>(
    () => options.map((option) => ({ id: option.value, name: option.label })),
    [options],
  );
  const selected = useMemo<MultiSelectItem[]>(
    () =>
      tokens.map((token) => ({
        id: token,
        name: labels.current.get(token) ?? token,
      })),
    // The labels follow the terms and the options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokens, terms, options],
  );

  return (
    <MultiSelect
      className={className}
      label={label}
      description={description}
      errorMessage={errorMessage}
      placeholder={placeholder ?? t('cmsui.widgets.array.placeholder')}
      name={name}
      items={suggestions}
      value={selected}
      onChange={(next) => onChange(next.map((item) => item.id))}
      inputValue={input}
      onInputChange={setInput}
      allowsCustomValue={creatable}
      onBlur={onBlur}
      isRequired={required}
      isDisabled={disabled}
      isReadOnly={readOnly}
      isInvalid={invalid}
      // Validation is the form's job, not the browser's.
      validationBehavior="aria"
    />
  );
}

ArrayWidget.displayName = 'ArrayWidget';
