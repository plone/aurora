import React from 'react';
import {
  type DialogProps,
  Sheet as RACSheet,
  SheetBackdrop,
  SheetContent,
  SheetOverlay,
  type SheetOverlayProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { composeTailwindRenderProps } from '../../utils';

// Only the bottom-most sheet in a stack dims the page behind it.
const backdropStyles = tv({
  base: "data-[stack-index='0']:bg-quanta-space/30",
});

const sheetStyles = tv({
  // Establish a 3D space (perspective) so stacked sheets can scale backward
  // along the z-axis. `box-content`: React Aria adds padding beyond the screen
  // edge (`overscrollPadding`), which mustn't eat the sheet's own size.
  base: `
    z-[1] box-content
    [transform:perspective(1000px)]
    overflow-clip border-quanta-smoke bg-quanta-air text-quanta-space shadow-2xl outline-hidden
    will-change-transform
    forced-colors:bg-[Canvas]
  `,
  variants: {
    position: {
      // On the sides, a full-height panel, flush with the edge.
      left: 'h-full w-full max-w-md origin-[150px_center] border-r',
      right: 'h-full w-full max-w-md origin-[-150px_center] border-l',
      bottom: `
        max-h-[calc(100%_-_32px)] w-full max-w-[800px] origin-[center_-150px] rounded-t-2xl border-t
      `,
      top: `
        max-h-[calc(100%_-_32px)] w-full max-w-[800px] origin-[center_150px] rounded-b-2xl border-b
      `,
      center: `
        max-h-[calc(100%_-_32px)] w-[calc(100%-1rem)] max-w-[800px] origin-[center_-150px]
        rounded-2xl border
      `,
    },
  },
  defaultVariants: {
    position: 'bottom',
  },
});

// Only scroll the inner content once the sheet is fully expanded. At a
// partial snap point, a swipe on the content expands the sheet instead.
const contentStyles = tv({
  base: `
    box-border h-full overflow-hidden overscroll-auto p-6
    pb-[calc(var(--spacing)*6+var(--sheet-scroll-padding-y,0px))] outline-hidden
    [scrollbar-gutter:stable]
    group-data-[expanded]/sheet:overflow-auto
  `,
});

export interface SheetProps extends Omit<SheetOverlayProps, 'children'> {
  /** The contents of the sheet. Rendered inside a Dialog. */
  children?: DialogProps['children'];
  /**
   * Whether to add padding to the sheet so that it appears to continue
   * outside the viewport.
   *
   * @default true
   */
  overscrollPadding?: boolean;
}

/**
 * A panel that slides in from an edge of the screen: a side panel on the
 * left or right, or a sheet from the bottom or top. On touch devices it can
 * be swiped away. Built on React Aria's `Sheet`.
 */
export function Sheet({ children, overscrollPadding, ...props }: SheetProps) {
  const { snapPoints } = props;
  return (
    <SheetOverlay
      {...props}
      className={composeTailwindRenderProps(props.className, 'group/sheet')}
    >
      {/* The backdrop fades in as the sheet slides in. With snap points, it
          stays hidden until the sheet is dragged past the last one. */}
      <SheetBackdrop
        className={backdropStyles()}
        swipeAnimation="sheet-backdrop"
        swipeAnimationRange={
          snapPoints ? { start: snapPoints.length - 1 } : undefined
        }
      />
      {/* `overscrollPadding` makes the sheet appear to continue past the edge
          of the screen when overscrolled. The stack animation scales a sheet
          back when another one opens on top of it. */}
      <RACSheet
        overscrollPadding={overscrollPadding ?? true}
        stackAnimation="sheet-scale-back"
        className={({ position }) => sheetStyles({ position })}
      >
        <SheetContent className={contentStyles()}>{children}</SheetContent>
      </RACSheet>
    </SheetOverlay>
  );
}
