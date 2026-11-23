import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { atom, useAtom, useSetAtom } from 'jotai';
import { tv } from 'tailwind-variants';
import { Pluggable } from '@plone/layout/components/Pluggable';

/** On wide screens: the sidebar is collapsed. It starts open. */
export const sidebarAtom = atom(false);

/** On phones: the sidebar is open, as a panel over the bottom of the page. */
export const sidebarPhoneOpenAtom = atom(false);

// Tailwind's `md` breakpoint: below it, the sidebar is a bottom panel.
const PHONE_QUERY = '(max-width: 767px)';

const isPhone = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.(PHONE_QUERY).matches;

/**
 * Opens or closes the sidebar: the column on the right on wide screens, the
 * bottom panel on phones.
 */
export function useToggleSidebar() {
  const setCollapsed = useSetAtom(sidebarAtom);
  const setPhoneOpen = useSetAtom(sidebarPhoneOpenAtom);
  return useCallback(() => {
    if (isPhone()) setPhoneOpen((open) => !open);
    else setCollapsed((collapsed) => !collapsed);
  }, [setCollapsed, setPhoneOpen]);
}

// On phones the sidebar sits above the toolbar, which is a bar at the bottom.
const sidebar = tv({
  base: `
    fixed z-10 overflow-y-auto bg-quanta-air shadow-[0_12px_24px_0_var(--color-quanta-smoke)]
    max-md:inset-x-0 max-md:bottom-[calc(64px+env(safe-area-inset-bottom,0px))] max-md:h-[55dvh]
    max-md:rounded-t-2xl max-md:px-6 max-md:pb-6 max-md:shadow-[0_-8px_24px_0_rgb(2_19_34/0.12)]
    max-md:transition-[translate,visibility] max-md:duration-300 max-md:ease-out
    md:top-0 md:right-0 md:h-screen md:transition-[width,padding] md:duration-200 md:ease-linear
  `,
  variants: {
    collapsed: {
      // Without padding when collapsed: its content must not show.
      true: 'md:w-0 md:overflow-hidden md:p-0 md:shadow-none',
      false: 'md:w-[300px] md:p-8',
    },
    phoneOpen: {
      true: 'max-md:translate-y-0',
      false: 'max-md:invisible max-md:translate-y-[calc(100%+64px)]',
    },
  },
});

const Sidebar = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useAtom(sidebarAtom);
  const [phoneOpen, setPhoneOpen] = useAtom(sidebarPhoneOpenAtom);

  // On phones, Escape closes the panel.
  useEffect(() => {
    if (!phoneOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPhone()) setPhoneOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [phoneOpen, setPhoneOpen]);

  // A swipe down on the handle closes the panel.
  const swipeStart = useRef<number | null>(null);
  const onHandlePointerDown = (event: PointerEvent) => {
    swipeStart.current = event.clientY;
  };
  const onHandlePointerUp = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const distance = event.clientY - swipeStart.current;
    swipeStart.current = null;
    if (distance > 40) setPhoneOpen(false);
  };

  return (
    <aside
      aria-label={t('cmsui.sidebar.label')}
      id="sidebar"
      className={sidebar({ collapsed, phoneOpen })}
      onFocus={() => {
        if (isPhone()) {
          if (!phoneOpen) setPhoneOpen(true);
        } else if (collapsed) {
          setCollapsed(false);
        }
      }}
    >
      <div
        className={`
          sticky top-0 z-10 -mx-6 bg-quanta-air
          md:hidden
        `}
      >
        <button
          type="button"
          aria-label={t('cmsui.sidebar.close')}
          onClick={() => setPhoneOpen(false)}
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={() => (swipeStart.current = null)}
          className={`
            flex w-full touch-none justify-center pt-2 pb-4
            focus-visible:outline-3 focus-visible:outline-quanta-cobalt
          `}
        >
          <span className="h-1 w-10 rounded-full bg-quanta-silver" />
        </button>
      </div>
      {!collapsed && <Pluggable name="sidebar" />}
    </aside>
  );
};

export default Sidebar;
