import React from 'react';
import {
  Collection,
  Header,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger as AriaMenuTrigger,
  Separator as AriaSeparator,
  SubmenuTrigger as AriaSubmenuTrigger,
  composeRenderProps,
  type MenuItemProps,
  type MenuProps,
  type MenuSectionProps as AriaMenuSectionProps,
  type MenuTriggerProps as AriaMenuTriggerProps,
  type SeparatorProps,
  type SubmenuTriggerProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { twMerge } from 'tailwind-merge';
import { CheckboxIcon, ChevronrightIcon } from '@plone/icons';
import { Popover, type PopoverProps } from '../Popover/Popover';
import { composeTailwindRenderProps, focusRing } from '../../utils';
import { getMenuTriggerChildren } from './menuTriggerChildren';

export function Menu<T>(props: MenuProps<T>) {
  return (
    <AriaMenu
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        `
          max-h-[inherit] overflow-auto p-1 font-sans
          [clip-path:inset(0_0_0_0_round_.75rem)]
          empty:pb-2 empty:text-center
        `,
      )}
    />
  );
}

const menuItemStyles = tv({
  extend: focusRing,
  base: `
    group relative flex cursor-default items-center gap-4 rounded-lg py-2 pr-3 pl-3 text-sm
    no-underline forced-color-adjust-none select-none
    [-webkit-tap-highlight-color:transparent]
    selected:pr-1
    [&[href]]:cursor-pointer
  `,
  variants: {
    isDisabled: {
      false: `
        text-quanta-space
        dark:text-neutral-100
      `,
      true: `
        text-quanta-silver
        dark:text-neutral-600
        forced-colors:text-[GrayText]
      `,
    },
    isPressed: {
      true: `
        bg-quanta-snow
        dark:bg-neutral-800
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
        dark:bg-neutral-700/60
      `,
    },
  ],
});

export function MenuItem(props: MenuItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === 'string' ? props.children : undefined);

  return (
    <AriaMenuItem
      {...props}
      textValue={textValue}
      className={composeRenderProps(props.className, (className, renderProps) =>
        menuItemStyles({ ...renderProps, className }),
      )}
    >
      {composeRenderProps(
        props.children,
        (children, { selectionMode, isSelected, hasSubmenu }) => (
          <>
            {selectionMode !== 'none' && (
              <span className="flex w-4 items-center">
                {isSelected && <CheckboxIcon aria-hidden className="h-4 w-4" />}
              </span>
            )}
            {children}
            {hasSubmenu && (
              <ChevronrightIcon
                aria-hidden
                className="absolute right-2 h-4 w-4"
              />
            )}
          </>
        ),
      )}
    </AriaMenuItem>
  );
}

export function MenuSeparator(props: SeparatorProps) {
  return (
    <AriaSeparator
      {...props}
      className={twMerge(
        `
          mx-3 my-1 border-b border-quanta-silver
          dark:border-neutral-700
        `,
        props.className,
      )}
    />
  );
}

export interface MenuSectionProps<T> extends AriaMenuSectionProps<T> {
  title?: string;
  items?: any;
}

export function MenuSection<T>({
  title,
  items,
  children,
  ...props
}: MenuSectionProps<T>) {
  return (
    <AriaMenuSection
      {...props}
      className={twMerge(
        `
          after:block after:h-[5px] after:content-['']
          first:-mt-[5px]
          last:after:hidden
        `,
        props.className,
      )}
    >
      {title && (
        <Header
          className={`
            sticky -top-[5px] z-10 -mx-1 -mt-px truncate border-y border-y-quanta-smoke
            bg-quanta-snow/60 px-4 py-1 text-sm font-semibold text-quanta-pigeon backdrop-blur-md
            supports-[-moz-appearance:none]:bg-quanta-snow
            dark:border-y-neutral-700 dark:bg-neutral-700/60 dark:text-neutral-300
            [&+*]:mt-1
          `}
        >
          {title}
        </Header>
      )}
      <Collection items={items}>{children}</Collection>
    </AriaMenuSection>
  );
}

interface MenuTriggerProps extends AriaMenuTriggerProps {
  placement?: PopoverProps['placement'];
}

export function MenuTrigger(props: MenuTriggerProps) {
  const [trigger, menu] = getMenuTriggerChildren(props.children, 'MenuTrigger');

  return (
    <AriaMenuTrigger {...props}>
      {trigger}
      <Popover placement={props.placement} className="min-w-[150px]">
        {menu}
      </Popover>
    </AriaMenuTrigger>
  );
}

export function SubmenuTrigger(props: SubmenuTriggerProps) {
  const [trigger, menu] = getMenuTriggerChildren(
    props.children,
    'SubmenuTrigger',
  );

  return (
    <AriaSubmenuTrigger {...props}>
      {trigger}
      <Popover offset={-2} crossOffset={-4}>
        {menu}
      </Popover>
    </AriaSubmenuTrigger>
  );
}
