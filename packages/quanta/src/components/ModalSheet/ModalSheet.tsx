import React, { useContext, useState } from 'react';
import { OverlayTriggerStateContext } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { Sheet, type SheetProps } from '../Sheet/Sheet';

// Tailwind's `md` breakpoint: below it, the modal becomes a bottom sheet. On
// the server, `useMediaQuery` assumes a wide screen. The modal only renders
// when open, which happens on the client.
const NARROW_QUERY = '(width < 48rem)';

export interface ModalSheetProps extends Omit<SheetProps, 'position'> {
  /**
   * Where the sheet appears on wide screens. On narrow screens it is always
   * a bottom sheet.
   *
   * @default 'center'
   */
  position?: SheetProps['position'];
}

/**
 * A modal dialog that becomes a bottom sheet on narrow screens, where it can
 * be swiped away. On wide screens it is centered, like a `Modal`. Open it
 * with a `DialogTrigger`, or control it with `isOpen` and `onOpenChange`.
 */
export function ModalSheet({ position = 'center', ...props }: ModalSheetProps) {
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const triggerState = useContext(OverlayTriggerStateContext);
  const isOpen =
    props.isOpen ?? triggerState?.isOpen ?? props.defaultOpen ?? false;
  const currentPosition = isNarrow ? 'bottom' : position;

  // React Aria lays the sheet out when it opens, and doesn't support changing
  // `position` while it's open. So if the screen is resized (or a phone is
  // rotated) while it's open, keep the position it opened with until the
  // next time it opens, instead of remounting it and losing its state.
  const [openPosition, setOpenPosition] = useState<
    SheetProps['position'] | null
  >(null);
  if (isOpen && openPosition === null) {
    setOpenPosition(currentPosition);
  } else if (!isOpen && openPosition !== null) {
    setOpenPosition(null);
  }

  return <Sheet {...props} position={openPosition ?? currentPosition} />;
}
