import React, { forwardRef } from 'react';
import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from 'react-aria-components';
import { button } from './Button.variants';
import { link } from '../Link/Link.variants';

type ButtonVariants = Parameters<typeof button>[0];

export type ButtonProps = RACButtonProps &
  ButtonVariants & {
    asLink?: never;
  };

type LinkVariants = Parameters<typeof link>[0];

type ButtonAsLinkProps = RACButtonProps &
  LinkVariants & {
    asLink: true;
  };

export const Button = forwardRef(function _Button(
  props: ButtonProps | ButtonAsLinkProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { asLink, variant, ...buttonProps } = props;

  return (
    <RACButton
      ref={ref}
      {...buttonProps}
      className={composeRenderProps(
        props.className,
        (className, renderProps) => {
          if (asLink) {
            return link({
              ...renderProps,
              className,
              variant,
            });
          }
          return button({
            ...renderProps,
            variant,
            size: props.size,
            accent: props.accent,
            className,
          });
        },
      )}
    >
      {composeRenderProps(props.children, (children, { isPending }) =>
        isPending ? (
          <>
            {children}
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <span
                className={`
                  size-4 animate-spin rounded-full border-2 border-current border-t-transparent
                  motion-reduce:animate-none
                  ${'accent' in props && props.accent ? 'text-quanta-air' : 'text-quanta-iron'}
                `}
              />
            </span>
          </>
        ) : (
          children
        ),
      )}
    </RACButton>
  );
});
