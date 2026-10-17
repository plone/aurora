import React from 'react';
import {
  Button,
  Collection,
  Header,
  ListBoxSection,
  Select as RACSelect,
  SelectValue,
  type ListBoxItemProps,
  type ListBoxProps,
  type SelectProps as RACSelectProps,
  type ValidationResult,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { Description, FieldError, Label } from '../Field/Field';
import {
  DropdownItem,
  type DropdownSectionProps,
  ListBox,
} from '../ListBox/ListBox';
import { Popover } from '../Popover/Popover';
import { composeTailwindRenderProps, focusRing } from '../../utils';
import { ChevrondownIcon } from '@plone/icons';

export interface SelectItemObject {
  label: string;
  value: string;
}

export interface SelectProps<
  T = SelectItemObject,
  M extends 'single' | 'multiple' = 'single',
> extends Omit<RACSelectProps<T, M>, 'children'> {
  label?: string;
  /** Classes for the label. A Quanta extra. */
  labelClassnames?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  items?: Iterable<T>;
  /**
   * The items, or a function that renders each item of `items`. A Quanta
   * extra: without it, the items are `SelectItemObject`s, rendered by their
   * `label`.
   */
  children?: React.ReactNode | ((item: T) => React.ReactNode);
}

const triggerStyles = tv({
  extend: focusRing,
  base: `
    flex min-h-12 min-w-[180px] items-center gap-3 rounded-md bg-quanta-snow px-3 py-2 text-left
    text-sm text-quanta-space transition
    hover:bg-quanta-smoke
    focus:bg-quanta-air
    active:bg-quanta-air
    forced-colors:bg-[Field]
  `,
  variants: {
    isDisabled: {
      true: `
        cursor-not-allowed bg-quanta-air text-quanta-silver
        hover:bg-quanta-air
        forced-colors:text-[GrayText]
      `,
    },
    isInvalid: {
      true: `
        bg-quanta-ballet
        hover:bg-quanta-flamingo
      `,
    },
  },
});

function DefaultSelectItem(item: SelectItemObject) {
  return <SelectItem id={item.value}>{item.label}</SelectItem>;
}

export function Select<
  T = SelectItemObject,
  M extends 'single' | 'multiple' = 'single',
>({
  label,
  description,
  errorMessage,
  children,
  items,
  labelClassnames,
  ...props
}: SelectProps<T, M>) {
  return (
    <RACSelect
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group flex flex-col gap-1',
      )}
    >
      {({ isOpen }) => (
        <>
          {label && <Label className={labelClassnames}>{label}</Label>}
          <Button className={triggerStyles}>
            <SelectValue
              className={`
                min-w-0 flex-1 truncate
                data-[placeholder]:text-quanta-pigeon
              `}
            >
              {({ selectedText, defaultChildren }) =>
                selectedText || defaultChildren
              }
            </SelectValue>
            <SelectChevron isOpen={isOpen} />
          </Button>
          <FieldError>{errorMessage}</FieldError>
          {description && <Description>{description}</Description>}
          <Popover className="min-w-(--trigger-width) p-1">
            {children ? (
              <SelectListBox items={items}>{children}</SelectListBox>
            ) : (
              <SelectListBox<SelectItemObject>
                items={items as Iterable<SelectItemObject> | undefined}
              >
                {DefaultSelectItem}
              </SelectListBox>
            )}
          </Popover>
        </>
      )}
    </RACSelect>
  );
}

function SelectChevron({ isOpen }: { isOpen: boolean }) {
  // Icons inherit their color, so the wrapper sets it.
  return (
    <span className="flex shrink-0 text-quanta-iron">
      <ChevrondownIcon
        aria-hidden
        size="xs"
        className={
          isOpen ? 'rotate-180 transition-transform' : 'transition-transform'
        }
      />
    </span>
  );
}

function SelectListBox<T>(props: ListBoxProps<T>) {
  return (
    <ListBox
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'max-h-72 min-w-(--trigger-width) p-1',
      )}
    />
  );
}

export function SelectItem(props: ListBoxItemProps) {
  return <DropdownItem {...props} />;
}

export function SelectSection<T>({
  title,
  items,
  children,
  ...props
}: DropdownSectionProps<T>) {
  return (
    <ListBoxSection
      {...props}
      className={`
        after:block after:h-1 after:content-['']
        first:after:h-0
      `}
    >
      {title && (
        <Header
          className={`px-3 py-1 text-xs font-semibold tracking-wide text-quanta-pigeon uppercase`}
        >
          {title}
        </Header>
      )}
      <Collection items={items}>{children}</Collection>
    </ListBoxSection>
  );
}
