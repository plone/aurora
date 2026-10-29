/**
 * A Menu component designed for use inside the Toolbar's shadow DOM.
 *
 * React Aria's Popover uses FocusScope and useInteractOutside, which rely on
 * `document.activeElement`. Inside a shadow DOM, `document.activeElement`
 * returns the shadow host element rather than the actual focused element,
 * breaking focus containment and outside-click detection.
 *
 * ToolbarMenu works around this by:
 *  - Setting `isNonModal` on the Popover to disable FocusScope containment
 *  - Blocking Tab while the menu is open, to trap the focus
 *  - Restoring focus to the trigger button when the menu closes
 *  - Managing open state and dismiss-on-outside-click manually via native
 *    event listeners on both the shadow root and document
 *
 * Usage is identical to the base Menu component. Pass custom CSS via the
 * `styles` prop (imported with `?inline`) — it will be injected into the
 * shadow root automatically:
 *
 *   import menuStyles from './MyMenu.css?inline';
 *
 *   <ToolbarMenu button={<MyIcon />} className="my-menu" styles={menuStyles}>
 *     <MenuItem href="/foo">Foo</MenuItem>
 *   </ToolbarMenu>
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { type ComponentProps } from 'react';
import { Button, DialogContext } from 'react-aria-components';
import { Sheet } from '@plone/quanta';
import { createPortal } from 'react-dom';
import { UNSAFE_PortalProvider } from 'react-aria';
import { ArrowleftIcon } from '@plone/icons';
import { useTranslation } from 'react-i18next';
import config from '@plone/registry';
import type { RegisteredComponent } from '@plone/types';

export interface ToolbarMenuProps extends ComponentProps<
  RegisteredComponent<'MenuTrigger'>
> {
  /** Present this menu in a bottom sheet on narrow screens. */
  mobileSheet?: boolean;
  icon?: React.ReactNode;
  triggerLabel?: string;
  onMenuOpen?: () => void;
  /** CSS string (imported with `?inline`) to inject into the shadow root. */
  styles?: string;
}

export function ToolbarMenu({
  icon,
  mobileSheet = false,
  triggerLabel,
  onMenuOpen,
  styles,
  children,
  ...props
}: ToolbarMenuProps) {
  const MenuTrigger = config.getComponent('MenuTrigger').component!;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (!mobileSheet || !window.matchMedia) return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => {
      setIsMobile(media.matches);
      setIsOpen(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [mobileSheet]);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const focusTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(focusTimer.current), []);

  const triggerRefCallback = useCallback((node: HTMLButtonElement | null) => {
    triggerRef.current = node;
  }, []);

  const onOpenChange = (isOpen: boolean) => {
    window.clearTimeout(focusTimer.current);
    setIsOpen(isOpen);

    if (isOpen) onMenuOpen?.();
    if (!isOpen) {
      if (isMobile) {
        // The modal keeps the toolbar inert until its exit animation completes.
        focusTimer.current = window.setTimeout(
          () => triggerRef.current?.focus(),
          500,
        );
      } else {
        triggerRef.current?.focus();
      }
    }
  };

  // Closes the menu on outside clicks. Two listeners are needed because Shadow DOM
  // retargets events at the document level, so only the shadow-root listener can
  // distinguish trigger clicks from popover clicks within the toolbar.
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
    if (!shadowRoot || !('host' in shadowRoot)) return;

    // Inside the shadow root e.target is the real element, so plain contains() works.
    const onShadowPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) {
        setIsOpen(false);
        return;
      }
      const popovers = shadowRoot.querySelectorAll('.react-aria-Popover');
      if (Array.from(popovers).some((popover) => popover.contains(target)))
        return;
      setIsOpen(false);
    };

    // At the document level, shadow-root events are retargeted to the shadow
    // host — only close when the click genuinely came from outside the toolbar.
    const onDocumentPointerDown = (e: PointerEvent) => {
      if (shadowRoot.host.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    shadowRoot.addEventListener(
      'pointerdown',
      onShadowPointerDown as EventListener,
    );
    document.addEventListener(
      'pointerdown',
      onDocumentPointerDown as EventListener,
    );

    return () => {
      shadowRoot.removeEventListener(
        'pointerdown',
        onShadowPointerDown as EventListener,
      );
      document.removeEventListener(
        'pointerdown',
        onDocumentPointerDown as EventListener,
      );
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    };

    if (isOpen && !isMobile) document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isMobile]);

  // When the menu is opened by clicking the trigger button, the focus stays on the trigger button.
  // To prevent this, the focus must be manually moved to the menu after mount.
  useLayoutEffect(() => {
    if (!isOpen || isMobile) return;

    const animationFrame = requestAnimationFrame(() => {
      const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
      if (!shadowRoot || !('host' in shadowRoot)) return;

      const menuId = triggerRef?.current?.getAttribute('aria-controls');
      if (!menuId) return;

      shadowRoot.getElementById(menuId)?.focus();
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [isOpen, isMobile]);

  if (isMobile) {
    return (
      <>
        {styles && <style>{styles}</style>}
        <button
          type="button"
          ref={triggerRefCallback}
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => onOpenChange(true)}
        >
          {icon}
        </button>
        {createPortal(
          <UNSAFE_PortalProvider getContainer={() => document.body}>
            {styles && <style>{styles}</style>}
            <DialogContext.Provider value={{ 'aria-label': triggerLabel }}>
              <Sheet
                className="toolbar-mobile-sheet"
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                position="bottom"
                overscrollPadding={false}
              >
                <div className="toolbar-mobile-sheet-content">
                  {children}
                  <button
                    type="button"
                    className="toolbar-mobile-sheet-close"
                    onClick={() => onOpenChange(false)}
                    aria-label={t('layout.toolbar.closeMenu', {
                      defaultValue: 'Close {{menu}}',
                      menu: triggerLabel,
                    })}
                  >
                    <ArrowleftIcon />
                  </button>
                </div>
              </Sheet>
            </DialogContext.Provider>
          </UNSAFE_PortalProvider>,
          document.body,
        )}
      </>
    );
  }

  return (
    <>
      {styles && <style>{styles}</style>}
      <MenuTrigger
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isNonModal={true}
        {...props}
      >
        <Button ref={triggerRefCallback} aria-label={triggerLabel}>
          {icon}
        </Button>
        {children}
      </MenuTrigger>
    </>
  );
}
