import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { TabListStateContext } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';

export interface TabPanelCarouselProps {
  /** The `TabPanel`s, in the order of their tabs, with `shouldForceMount`. */
  children: ReactNode;
  className?: string;
}

// How far, in pixels, the mouse moves before a drag starts.
const DRAG_THRESHOLD = 6;

// What a mouse drag never starts on: fields and controls take their own drags.
const DRAG_EXCLUDED =
  'input, textarea, select, button, a[href], [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="textbox"], [draggable="true"]';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Lays the tab panels side by side, so that on narrow touch screens they can
 * be swiped, with scroll snapping. The selected tab follows the swipe, and its
 * indicator follows the finger. On other screens, selecting a tab shows its
 * panel with a short fade.
 *
 * Where they can be swiped, the panels can also be dragged with a mouse.
 *
 * Based on React Aria's swipeable tabs example. Render it as a direct child
 * of `Tabs`, after the `TabList`, and give every `TabPanel` `shouldForceMount`.
 * The carousel takes the height of the selected panel, and the width of its
 * container: its panels never make the container wider.
 */
export function TabPanelCarousel({
  children,
  className,
}: TabPanelCarouselProps) {
  const state = useContext(TabListStateContext);
  const ref = useRef<HTMLDivElement>(null);
  // A scroll the carousel started itself, after a tab was selected: the
  // selection already changed, so the scroll does not move the indicator.
  const isProgrammatic = useRef(false);
  // The editor is swiping the panels: their size must not reset the scroll.
  const isSwiping = useRef(false);
  // A smooth scroll cancels another one running on the tab list: the tab is
  // revealed once the panels stop scrolling.
  const revealPending = useRef(false);
  // The panels are being dragged with the mouse.
  const isDragging = useRef(false);

  const panelAt = (index: number) =>
    ref.current?.children[index] as HTMLElement | undefined;

  const tabElements = useCallback(() => {
    const tabList = ref.current?.parentElement?.querySelector(
      ':scope > [role="tablist"]',
    );
    return tabList
      ? [...tabList.querySelectorAll<HTMLElement>('[role="tab"]')]
      : [];
  }, []);

  // Scrolls the tab list, when it overflows, to center the tab.
  const revealTab = (index: number) => {
    const tab = tabElements()[index];
    const tabList = tab?.parentElement;
    if (!tab || !tabList || tabList.scrollWidth <= tabList.clientWidth) return;
    const listRect = tabList.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    tabList.scrollTo?.({
      left:
        tabList.scrollLeft +
        tabRect.left -
        listRect.left -
        (listRect.width - tabRect.width) / 2,
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    });
  };

  const isSwipeable = () =>
    !!ref.current && getComputedStyle(ref.current).overflowX !== 'hidden';

  const fitHeight = useCallback(
    (height?: number) => {
      const el = ref.current;
      const index = state?.selectedItem?.index;
      if (!el || index == null) return;
      el.style.height = `${height ?? panelAt(index)?.offsetHeight ?? 0}px`;
    },
    [state?.selectedItem?.index],
  );

  // Moves the selected tab's indicator part of the way to another tab, while
  // the panels are being swiped.
  const moveIndicator = (position: number) => {
    const tabs = tabElements();
    const index = state?.selectedItem?.index;
    if (index == null || !tabs[index]) return;
    const indicator = tabs[index].querySelector<HTMLElement>(
      '.quanta-tab-indicator',
    );
    if (!indicator) return;
    const from = Math.floor(position);
    const to = Math.min(tabs.length - 1, Math.ceil(position));
    const ratio = position - from;
    const a = tabs[from].getBoundingClientRect();
    const b = tabs[to].getBoundingClientRect();
    const selected = tabs[index].getBoundingClientRect();
    const left = a.left + (b.left - a.left) * ratio;
    const width = a.width + (b.width - a.width) * ratio;
    // No transition while following the finger. It also keeps React Aria's
    // indicator from animating again when the selection changes at the end.
    indicator.style.transition = 'none';
    indicator.style.translate = `${left - selected.left}px 0`;
    indicator.style.width = `${width}px`;
  };

  const resetIndicator = () => {
    const index = state?.selectedItem?.index;
    if (index == null) return;
    const indicator = tabElements()[index]?.querySelector<HTMLElement>(
      '.quanta-tab-indicator',
    );
    if (!indicator) return;
    indicator.style.transition = '';
    indicator.style.translate = '';
    indicator.style.width = '';
  };

  const onScroll = () => {
    const el = ref.current;
    if (!el || !state || isProgrammatic.current || !el.clientWidth) return;
    isSwiping.current = true;
    const last = state.collection.size - 1;
    const position = Math.min(
      last,
      Math.max(0, el.scrollLeft / el.clientWidth),
    );
    moveIndicator(position);
    const from = panelAt(Math.floor(position));
    const to = panelAt(Math.ceil(position));
    fitHeight(Math.max(from?.offsetHeight ?? 0, to?.offsetHeight ?? 0));
  };

  const onScrollEnd = () => {
    const el = ref.current;
    // A mouse drag scrolls step by step: it settles when the button is up.
    if (!el || !state || !el.clientWidth || isDragging.current) return;
    isProgrammatic.current = false;
    isSwiping.current = false;
    if (revealPending.current) {
      revealPending.current = false;
      revealTab(state.selectedItem?.index ?? 0);
    }
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const item = [...state.collection][index];
    if (
      item &&
      item.key !== state.selectedKey &&
      !state.disabledKeys.has(item.key)
    ) {
      // Synchronously, so the indicator in the new tab replaces the moved
      // one in the same frame.
      flushSync(() => state.setSelectedKey(item.key));
    } else {
      resetIndicator();
      const selected = state.selectedItem?.index ?? 0;
      if (selected !== index) {
        el.scrollTo({ left: selected * el.clientWidth, behavior: 'smooth' });
      }
      fitHeight();
    }
  };

  // Selects the panel the swipe ended on. Safari has no `scrollend` event
  // yet: there, wait for the scrolling to stop.
  const onScrollEndRef = useRef(onScrollEnd);
  onScrollEndRef.current = onScrollEnd;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if ('onscrollend' in window) {
      const listener = () => onScrollEndRef.current();
      el.addEventListener('scrollend', listener);
      return () => el.removeEventListener('scrollend', listener);
    }
    let timeout: ReturnType<typeof setTimeout>;
    const onScrollStop = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => onScrollEndRef.current(), 150);
    };
    el.addEventListener('scroll', onScrollStop);
    return () => {
      clearTimeout(timeout);
      el.removeEventListener('scroll', onScrollStop);
    };
  }, []);

  // Where the panels can be swiped, they can also be dragged with a mouse, as
  // touch screens are often tried out with one. A drag starts once the mouse
  // moves sideways, and never on a field or a control, which take their own
  // drags (eg. to select text).
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number; left: number; id: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (
        event.pointerType !== 'mouse' ||
        event.button !== 0 ||
        !isSwipeable() ||
        (event.target as Element).closest?.(DRAG_EXCLUDED)
      ) {
        return;
      }
      start = {
        x: event.clientX,
        y: event.clientY,
        left: el.scrollLeft,
        id: event.pointerId,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      if (!isDragging.current) {
        const dy = event.clientY - start.y;
        if (Math.abs(dy) > DRAG_THRESHOLD && Math.abs(dy) >= Math.abs(dx)) {
          start = null;
          return;
        }
        if (Math.abs(dx) <= DRAG_THRESHOLD) return;
        isDragging.current = true;
        isProgrammatic.current = false;
        el.setPointerCapture?.(event.pointerId);
        // Snapping would fight the drag.
        el.style.scrollSnapType = 'none';
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
      }
      event.preventDefault();
      el.scrollLeft = start.left - dx;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      start = null;
      if (!isDragging.current) return;
      isDragging.current = false;
      el.style.scrollSnapType = '';
      el.style.cursor = '';
      el.style.userSelect = '';
      // The click that ends the drag must not reach what is under the mouse.
      const stopClick = (click: MouseEvent) => {
        click.stopPropagation();
        click.preventDefault();
      };
      window.addEventListener('click', stopClick, { capture: true });
      setTimeout(
        () => window.removeEventListener('click', stopClick, { capture: true }),
        0,
      );
      const current = stateRef.current;
      const last = (current?.collection.size ?? 1) - 1;
      const index = current?.selectedItem?.index ?? 0;
      const width = el.clientWidth;
      // A short drag is enough to go to the next panel.
      let target = index;
      if (dx < -width * 0.15) target = Math.min(last, index + 1);
      else if (dx > width * 0.15) target = Math.max(0, index - 1);
      el.scrollTo({
        left: target * width,
        behavior: prefersReducedMotion() ? 'instant' : 'smooth',
      });
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shows the selected panel when a tab is selected: by scrolling to it on
  // narrow touch screens, and with a fade elsewhere.
  useLayoutEffect(() => {
    const el = ref.current;
    const index = state?.selectedItem?.index;
    if (!el || index == null) return;
    fitHeight();
    const left = index * el.clientWidth;
    const animate = !prefersReducedMotion();
    if (Math.abs(el.scrollLeft - left) < 1) {
      revealTab(index);
      return;
    }
    if (isSwipeable() && animate) {
      isProgrammatic.current = true;
      revealPending.current = true;
      el.scrollTo({ left, behavior: 'smooth' });
    } else {
      // The scroll events it fires come after this: ignore them too.
      isProgrammatic.current = true;
      el.scrollTo({ left, behavior: 'instant' });
      revealTab(index);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          isProgrammatic.current = false;
        }),
      );
      if (animate) {
        panelAt(index)?.animate?.([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          easing: 'ease-out',
        });
      }
    }
    // The collection is built after the first render: run again once the
    // selected item exists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.selectedKey, state?.selectedItem?.index]);

  // Follows the selected panel's height, as its fields change (eg. an error
  // shows), and keeps it in view when the carousel's width changes.
  useEffect(() => {
    const el = ref.current;
    const index = state?.selectedItem?.index;
    const panel = index == null ? undefined : panelAt(index);
    if (!el || !panel || typeof ResizeObserver === 'undefined') return;
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (isSwiping.current || isProgrammatic.current) return;
      fitHeight();
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        el.scrollLeft = index! * width;
      }
    });
    observer.observe(panel);
    observer.observe(el);
    return () => observer.disconnect();
  }, [state?.selectedItem?.index, fitHeight]);

  return (
    <div
      ref={ref}
      data-tab-carousel=""
      className={twMerge(
        `
          relative flex items-start overflow-x-hidden overflow-y-hidden overscroll-x-contain
          [contain:inline-size]
          [scrollbar-width:none]
          *:w-full *:flex-none *:snap-start *:snap-always
          motion-safe:transition-[height]
          max-md:pointer-coarse:snap-x max-md:pointer-coarse:snap-mandatory
          max-md:pointer-coarse:overflow-x-auto
          [&::-webkit-scrollbar]:hidden
        `,
        className,
      )}
      // Snapping is only on where the panels can be swiped: elsewhere, a
      // layout change could snap them to another panel.
      onScroll={onScroll}
    >
      {children}
    </div>
  );
}
