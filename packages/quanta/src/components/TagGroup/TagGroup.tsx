import React, { createContext, useContext } from 'react';
import {
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  type TagGroupProps as AriaTagGroupProps,
  type TagProps as AriaTagProps,
  Button,
  TagList,
  type TagListProps,
  Text,
  composeRenderProps,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import { Description, Label } from '../Field/Field';
import { focusRing } from '../../utils';
import { CloseIcon } from '@plone/icons';

const colors = {
  gray: 'bg-quanta-air text-quanta-denim border-quanta-silver hover:border-quanta-dolphin',
  green:
    'bg-quanta-daiquiri text-quanta-emerald border-quanta-mint hover:border-quanta-celery ',
  yellow:
    'bg-quanta-cream text-quanta-dijon border-quanta-banana hover:border-quanta-lemon ',
  blue: 'bg-quanta-arctic text-quanta-royal border-quanta-sky hover:border-quanta-azure',
};

type Color = keyof typeof colors;
const ColorContext = createContext<Color>('gray');

const tagStyles = tv({
  extend: focusRing,
  base: `
    flex max-w-fit cursor-default items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm
    leading-6 transition
  `,
  variants: {
    color: {
      gray: '',
      green: '',
      yellow: '',
      blue: '',
    },
    allowsRemoving: {
      true: 'pr-0.5',
    },
    isSelected: {
      true: 'border-transparent',
    },
    isDisabled: {
      true: 'bg-quanta-pigeon text-quanta-silver',
    },
  },
  compoundVariants: (Object.keys(colors) as Color[]).map((color) => ({
    isSelected: false,
    isDisabled: false,
    color,
    class: colors[color],
  })),
});

export interface TagGroupProps<T>
  extends
    Omit<AriaTagGroupProps, 'children'>,
    Pick<TagListProps<T>, 'items' | 'children' | 'renderEmptyState'> {
  color?: Color;
  label?: string;
  description?: string;
  errorMessage?: string;
}

export interface TagProps extends AriaTagProps {
  color?: Color;
}

export function TagGroup<T>({
  label,
  description,
  errorMessage,
  items,
  children,
  renderEmptyState,

  ...props
}: TagGroupProps<T>) {
  return (
    <AriaTagGroup
      {...props}
      className={twMerge('flex flex-col', props.className)}
    >
      <Label>{label}</Label>
      <ColorContext.Provider value={props.color || 'gray'}>
        <TagList
          items={items}
          renderEmptyState={renderEmptyState}
          className="flex flex-wrap gap-1"
        >
          {children}
        </TagList>
      </ColorContext.Provider>
      {description && <Description>{description}</Description>}
      {errorMessage && (
        <Text slot="errorMessage" className="text-sm text-quanta-candy">
          {errorMessage}
        </Text>
      )}
    </AriaTagGroup>
  );
}

const removeButtonStyles = tv({
  extend: focusRing,
  base: `
    flex size-6 cursor-default items-center justify-center rounded-full text-quanta-iron
    transition-[background-color]
    hover:bg-quanta-snow
    pressed:bg-quanta-smoke
  `,
});

export function Tag({ children, color, ...props }: TagProps) {
  const textValue = typeof children === 'string' ? children : undefined;
  const groupColor = useContext(ColorContext);
  return (
    <AriaTag
      textValue={textValue}
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tagStyles({ ...renderProps, className, color: color || groupColor }),
      )}
    >
      {composeRenderProps(children, (children, { allowsRemoving }) => (
        <>
          {children}
          {allowsRemoving && (
            <Button slot="remove" className={removeButtonStyles}>
              <CloseIcon aria-hidden className="size-4" />
            </Button>
          )}
        </>
      ))}
    </AriaTag>
  );
}
