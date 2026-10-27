import React, { useMemo, useState } from 'react';
import type { Key, ValidationResult } from 'react-aria-components';
import { ComboBox, ComboBoxItem } from '../ComboBox/ComboBox';
import { Tag, TagGroup } from '../TagGroup/TagGroup';

export interface MultiSelectItem {
  id: string;
  name: string;
}

export interface MultiSelectProps<T extends MultiSelectItem = MultiSelectItem> {
  /** The selected items, in order. */
  value: T[];
  /** Called with the new list of selected items. */
  onChange: (value: T[]) => void;
  /** The items to choose from. The selected ones aren't suggested again. */
  items: Iterable<T>;
  /**
   * Whether the editor can add a value that isn't one of the `items`, by
   * typing it and pressing Enter, or leaving the field.
   *
   * @default false
   */
  allowsCustomValue?: boolean;
  /** The text in the input, to search the items elsewhere, such as a server. */
  inputValue?: string;
  onInputChange?: (value: string) => void;
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
  name?: string;
  className?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  validationBehavior?: 'native' | 'aria';
  onBlur?: () => void;
}

/**
 * Selects several items, shown as tags under the field. The editor types to
 * find an item, and removes one from its tag. Built on Quanta's `ComboBox`
 * and `TagGroup`.
 */
export function MultiSelect<T extends MultiSelectItem = MultiSelectItem>({
  value,
  onChange,
  items,
  allowsCustomValue = false,
  inputValue,
  onInputChange,
  label,
  description,
  errorMessage,
  placeholder,
  name,
  className,
  isRequired,
  isDisabled,
  isReadOnly,
  isInvalid,
  validationBehavior,
  onBlur,
}: MultiSelectProps<T>) {
  const [uncontrolledInput, setUncontrolledInput] = useState('');
  const input = inputValue ?? uncontrolledInput;
  const setInput = (next: string) => {
    setUncontrolledInput(next);
    onInputChange?.(next);
  };

  const selectedIds = useMemo(() => value.map((item) => item.id), [value]);
  const suggestions = useMemo(
    () => [...items].filter((item) => !selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const add = (item: T) => {
    setInput('');
    if (selectedIds.includes(item.id)) return;
    onChange([...value, item]);
  };

  // A typed value is the matching item, or a new one.
  const addText = (text: string) => {
    const typed = text.trim();
    if (!typed) {
      setInput('');
      return;
    }
    const match = [...items].find(
      (item) => item.id === typed || item.name === typed,
    );
    add(match ?? ({ id: typed, name: typed } as T));
  };

  const remove = (keys: Set<Key>) => {
    onChange(value.filter((item) => !keys.has(item.id)));
  };

  const editable = !isDisabled && !isReadOnly;

  return (
    <div className={className}>
      <ComboBox<T>
        label={label}
        description={description}
        errorMessage={errorMessage}
        placeholder={placeholder}
        name={name}
        items={suggestions}
        inputValue={input}
        onInputChange={setInput}
        // The combo box adds items: it never keeps a selection.
        selectedKey={null}
        onSelectionChange={(key) => {
          const item = suggestions.find((suggestion) => suggestion.id === key);
          if (item) add(item);
        }}
        allowsCustomValue={allowsCustomValue}
        // No suggestions, no popover: it would hide the tags.
        allowsEmptyCollection={false}
        onKeyDown={(event) => {
          // Enter adds the typed value, unless an option is focused: then
          // the combo box selects that option.
          if (
            event.key === 'Enter' &&
            allowsCustomValue &&
            !(event.target as HTMLElement).getAttribute('aria-activedescendant')
          ) {
            event.preventDefault();
            addText(input);
          }
        }}
        onBlur={() => {
          if (allowsCustomValue && input.trim()) addText(input);
          onBlur?.();
        }}
        isRequired={isRequired}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isInvalid={isInvalid}
        validationBehavior={validationBehavior}
      >
        {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
      </ComboBox>
      {value.length > 0 && (
        <TagGroup<T>
          aria-label={label ?? name}
          items={value}
          onRemove={editable ? remove : undefined}
          className="mt-2"
        >
          {(item) => <Tag id={item.id}>{item.name}</Tag>}
        </TagGroup>
      )}
    </div>
  );
}
