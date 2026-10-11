import React from 'react';
import {
  ModalOverlay,
  type ModalOverlayProps,
  Modal as RACModal,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

export interface DrawerProps extends ModalOverlayProps {
  /** The side of the screen it slides in from. */
  placement?: 'right' | 'left';
}

const overlayStyles = tv({
  base: 'fixed inset-0 isolate z-20 bg-black/30',
  variants: {
    isEntering: {
      true: 'duration-200 ease-out animate-in fade-in',
    },
    isExiting: {
      true: 'duration-200 ease-in animate-out fade-out',
    },
  },
});

const drawerStyles = tv({
  base: `
    fixed top-0 bottom-0 flex w-full max-w-md flex-col overflow-y-auto border-quanta-smoke
    bg-quanta-air text-left text-quanta-space shadow-2xl outline-none
    forced-colors:bg-[Canvas]
  `,
  variants: {
    placement: {
      right: 'right-0 border-l',
      left: 'left-0 border-r',
    },
    isEntering: {
      true: 'duration-200 ease-out animate-in',
    },
    isExiting: {
      true: 'duration-200 ease-in animate-out',
    },
  },
  compoundVariants: [
    { placement: 'right', isEntering: true, className: 'slide-in-from-right' },
    { placement: 'right', isExiting: true, className: 'slide-out-to-right' },
    { placement: 'left', isEntering: true, className: 'slide-in-from-left' },
    { placement: 'left', isExiting: true, className: 'slide-out-to-left' },
  ],
});

/**
 * A modal panel that slides in from the side of the screen, for editing an
 * item next to the list it belongs to. Put a `Dialog` inside it.
 */
export function Drawer({ placement = 'right', ...props }: DrawerProps) {
  return (
    <ModalOverlay
      {...props}
      isDismissable={props.isDismissable ?? true}
      className={overlayStyles}
    >
      <RACModal
        {...props}
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            drawerStyles({ ...renderProps, placement, className }),
        )}
      />
    </ModalOverlay>
  );
}
