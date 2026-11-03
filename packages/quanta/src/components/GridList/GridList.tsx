'use client';
import React from 'react';
import {
  GridList as AriaGridList,
  GridListHeader as AriaGridListHeader,
  GridListItem as AriaGridListItem,
  Button,
  composeRenderProps,
  type GridListItemProps,
  type GridListProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Checkbox } from '../Checkbox/Checkbox';
import { composeTailwindRenderProps, focusRing } from '../../utils';
import { twMerge } from 'tailwind-merge';

export function GridList<T>({ children, ...props }: GridListProps<T>) {
  return (
    <AriaGridList
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'relative overflow-auto rounded-lg border',
      )}
    >
      {children}
    </AriaGridList>
  );
}

const itemStyles = tv({
  extend: focusRing,
  //   Data- selectors not even showing up, wtf
  base: `
    relative -mb-px flex cursor-default gap-3 border-y border-transparent px-3 py-2 text-sm
    -outline-offset-2 select-none
    first:rounded-t-md first:border-t-0
    last:mb-0 last:rounded-b-md last:border-b-0
  `,
  variants: {
    isSelected: {
      false: 'hover:bg-quanta-snow',
      true: 'z-20',
    },
    isDisabled: {
      true: `
        z-10
        forced-colors:text-[GrayText]
      `,
    },
  },
});

export function GridListItem({
  children,
  className = '',

  ...props
}: GridListItemProps) {
  const textValue = typeof children === 'string' ? children : undefined;
  return (
    <AriaGridListItem
      textValue={textValue}
      {...props}
      className={(renderProps) =>
        twMerge(
          itemStyles(renderProps),
          typeof className === 'function' ? className(renderProps) : className,
        )
      }
    >
      {composeRenderProps(
        children,
        (children, { selectionMode, selectionBehavior, allowsDragging }) => (
          <>
            {/* Add elements for drag and drop and selection. */}
            {allowsDragging && <Button slot="drag">≡</Button>}
            {selectionMode !== 'none' && selectionBehavior === 'toggle' && (
              <Checkbox slot="selection" />
            )}
            {children}
          </>
        ),
      )}
    </AriaGridListItem>
  );
}

export function GridListHeader({
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <AriaGridListHeader
      {...props}
      className={twMerge(
        'px-3 py-1 text-xs font-semibold tracking-wide text-quanta-pigeon uppercase',
        props.className,
      )}
    >
      {children}
    </AriaGridListHeader>
  );
}
