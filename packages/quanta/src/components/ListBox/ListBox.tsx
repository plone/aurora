import React from 'react';
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type ListBoxProps as AriaListBoxProps,
  Collection,
  Header,
  type ListBoxItemProps,
  ListBoxSection,
  type ListBoxSectionProps,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { composeTailwindRenderProps, focusRing } from '../../utils';
import { CheckboxIcon } from '@plone/icons';

interface ListBoxProps<T> extends Omit<
  AriaListBoxProps<T>,
  'layout' | 'orientation'
> {}

export function ListBox<T>({ children, ...props }: ListBoxProps<T>) {
  return (
    <AriaListBox
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'flex-1 overflow-auto outline-0',
      )}
    >
      {children}
    </AriaListBox>
  );
}

export const itemStyles = tv({
  extend: focusRing,
  base: `
    group relative flex cursor-default items-center gap-8 rounded-md px-2.5 py-1.5 text-sm
    will-change-transform forced-color-adjust-none select-none
  `,
  variants: {
    isSelected: {
      false: `
        text-quanta-iron -outline-offset-2
        hover:bg-quanta-smoke
        dark:text-zinc-300 dark:hover:bg-zinc-700
      `,
      true: `
        bg-quanta-sapphire text-quanta-air -outline-offset-4 outline-quanta-air
        dark:outline-white
        forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
        forced-colors:outline-[HighlightText]
        [&+[data-selected]]:rounded-t-none
        [&:has(+[data-selected])]:rounded-b-none
      `,
    },
    isDisabled: {
      true: `
        text-quanta-silver
        dark:text-zinc-600
        forced-colors:text-[GrayText]
      `,
    },
  },
});

export function ListBoxItem(props: ListBoxItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaListBoxItem {...props} textValue={textValue} className={itemStyles}>
      {composeRenderProps(props.children, (children) => (
        <>
          {children}
          <div
            className={`
              absolute right-4 bottom-0 left-4 hidden h-px bg-quanta-air/20
              forced-colors:bg-[HighlightText]
              [.group[data-selected]:has(+[data-selected])_&]:block
            `}
          />
        </>
      ))}
    </AriaListBoxItem>
  );
}

export const dropdownItemStyles = tv({
  base: `
    group flex cursor-default items-center gap-4 rounded-lg py-2 pr-1 pl-3 text-sm outline-0
    forced-color-adjust-none select-none
  `,
  variants: {
    isDisabled: {
      false: `
        text-quanta-space
        dark:text-zinc-100
      `,
      true: `
        text-quanta-silver
        dark:text-zinc-600
        forced-colors:text-[GrayText]
      `,
    },
    isFocused: {
      true: `
        bg-quanta-sapphire text-quanta-air
        forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
      `,
    },
  },
  compoundVariants: [
    {
      isFocused: false,
      isOpen: true,
      className: `
        bg-quanta-snow
        dark:bg-zinc-700/60
      `,
    },
  ],
});

export function DropdownItem(props: ListBoxItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaListBoxItem
      {...props}
      textValue={textValue}
      className={dropdownItemStyles}
    >
      {composeRenderProps(props.children, (children, { isSelected }) => (
        <>
          <span
            className={`
              flex flex-1 items-center gap-2 truncate font-normal
              group-selected:font-semibold
            `}
          >
            {children}
          </span>
          <span className="flex w-5 items-center">
            {isSelected && <CheckboxIcon className="h-4 w-4" />}
          </span>
        </>
      ))}
    </AriaListBoxItem>
  );
}

export interface DropdownSectionProps<T> extends ListBoxSectionProps<T> {
  title?: string;
  items?: any;
}

export function DropdownSection<T>(props: DropdownSectionProps<T>) {
  return (
    <ListBoxSection
      className={`
        after:block after:h-[5px] after:content-['']
        first:-mt-[5px]
      `}
    >
      <Header
        className={`
          sticky -top-[5px] z-10 -mx-1 -mt-px truncate border-y border-y-quanta-smoke
          bg-quanta-snow/60 px-4 py-1 text-sm font-semibold text-quanta-pigeon backdrop-blur-md
          supports-[-moz-appearance:none]:bg-quanta-snow
          dark:border-y-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-300
          [&+*]:mt-1
        `}
      >
        {props.title}
      </Header>
      <Collection items={props.items}>{props.children}</Collection>
    </ListBoxSection>
  );
}
