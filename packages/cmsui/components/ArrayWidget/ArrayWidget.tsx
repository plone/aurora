import { useEffect, useMemo, useRef, useState } from 'react';
import type { Key } from 'react-aria-components';
import type { FieldSchema, FormWidgetProps } from '@plone/types';
import { ComboBox, ComboBoxItem, Tag, TagGroup } from '@plone/quanta';
import { useTranslation } from 'react-i18next';
import { termOption, useChoices, type TermValue } from '../Form/useChoices';

/**
 * The widget reads a list of tokens, or of terms as the content API sends
 * them, and writes a list of tokens.
 */
export type ArrayWidgetProps = FormWidgetProps<TermValue[] | null>;

type TokenItem = { id: string; name: string };

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
 * Adapts the widget contract to the Quanta `ComboBox` and `TagGroup`
 * controls, for a list of strings, such as the tags of a page. The value is
 * the list of tokens.
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
    title: title || undefined,
  });

  // The labels of the tokens, kept while the options change with the search.
  const labels = useRef(new Map<string, string>());
  [...terms, ...options].forEach((option) =>
    labels.current.set(option.value, option.label),
  );

  const suggestions = useMemo<TokenItem[]>(
    () =>
      options
        .filter((option) => !tokens.includes(option.value))
        .map((option) => ({ id: option.value, name: option.label })),
    [options, tokens],
  );
  const selected = useMemo<TokenItem[]>(
    () =>
      tokens.map((token) => ({
        id: token,
        name: labels.current.get(token) ?? token,
      })),
    // The labels follow the terms and the options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokens, terms, options],
  );

  const add = (token: string) => {
    const next = token.trim();
    setInput('');
    if (!next || tokens.includes(next)) return;
    onChange([...tokens, next]);
  };

  const remove = (keys: Set<Key>) => {
    const next = tokens.filter((token) => !keys.has(token));
    onChange(next);
  };

  const editable = !disabled && !readOnly;

  return (
    <div className={className}>
      <ComboBox<TokenItem>
        label={label}
        description={description}
        errorMessage={errorMessage}
        placeholder={placeholder ?? t('cmsui.widgets.array.placeholder')}
        items={suggestions}
        inputValue={input}
        onInputChange={setInput}
        // The combo box adds tokens: it never keeps a selection.
        selectedKey={null}
        onSelectionChange={(key) => {
          if (key != null) add(String(key));
        }}
        allowsCustomValue={creatable}
        // No suggestions, no popover: it would hide the tags.
        allowsEmptyCollection={false}
        onKeyDown={(event) => {
          // Enter adds the typed token, unless an option is focused: then
          // the combo box selects that option.
          if (
            event.key === 'Enter' &&
            creatable &&
            !(event.target as HTMLElement).getAttribute('aria-activedescendant')
          ) {
            event.preventDefault();
            add(input);
          }
        }}
        onBlur={() => {
          if (creatable && input.trim()) add(input);
          onBlur?.();
        }}
        isRequired={required}
        isDisabled={disabled}
        isReadOnly={readOnly}
        isInvalid={invalid}
        // Validation is the form's job, not the browser's.
        validationBehavior="aria"
      >
        {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
      </ComboBox>
      {selected.length > 0 && (
        <TagGroup<TokenItem>
          aria-label={label ?? name}
          items={selected}
          onRemove={editable ? remove : undefined}
          className="mt-2"
        >
          {(item) => <Tag id={item.id}>{item.name}</Tag>}
        </TagGroup>
      )}
    </div>
  );
}

ArrayWidget.displayName = 'ArrayWidget';
