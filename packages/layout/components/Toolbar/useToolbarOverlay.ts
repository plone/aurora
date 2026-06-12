import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

/**
 * Shared open/close behaviour for toolbar overlays (ToolbarMenu, ToolbarPopover).
 *
 * Handles shadow-DOM quirks that React Aria's built-ins can't solve on their own:
 *
 *  - Outside-click detection via dual listeners (shadow root and document)
 *  - Tab trapping while the overlay is open
 *  - Native pointerup listener to open/toggle the overlay when React Aria's own
 *    press detection is broken by shadow-DOM event retargeting:
 *      mode='popover' (DialogTrigger): onPress is retargeted for ALL pointer
 *                     types → handle all of them natively; Tab is not blocked
 *      mode='menu'    (MenuTrigger, default): mouse is handled correctly by
 *                     onPressStart; only touch/pen need the native fallback;
 *                     Tab is blocked so arrow-key navigation works as expected
 */
export function useToolbarOverlay(mode: 'menu' | 'popover' = 'menu') {
  const mousePointerUp = mode === 'popover';
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLElement | null>(null);
  // Mutable mirror of isOpen for the stable always-on pointerup closure
  const isOpenRef = useRef(false);

  const onOpenChange = useCallback((open: boolean) => {
    isOpenRef.current = open;
    setIsOpen(open);
    if (!open) {
      triggerRef.current?.focus();
    }
  }, []);

  // Keep isOpenRef current after every render (covers external controlled changes)
  useLayoutEffect(() => {
    isOpenRef.current = isOpen;
  });

  // React Aria's usePress registers pointerup and keyup at window/document level;
  // in shadow DOM those events are retargeted to the shadow host, so onPress
  // never fires. These native shadow-root listeners see the real target and fill
  // the gap without breaking outside-click detection
  useEffect(() => {
    const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
    if (!shadowRoot || !('host' in shadowRoot)) return;

    const onPointerUp = (e: PointerEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) return;
      if (
        !mousePointerUp &&
        e.pointerType !== 'touch' &&
        e.pointerType !== 'pen'
      )
        return;

      onOpenChange(!isOpenRef.current);
    };

    // Keyboard open/close for DialogTrigger (mousePointerUp=true only)
    // MenuTrigger already handles keyboard correctly via onPressStart at element level
    const onKeyDown = (e: KeyboardEvent) => {
      if (!mousePointerUp) return;
      if (!triggerRef.current?.contains(e.target as Node)) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.key === ' ') e.preventDefault(); // prevent page scroll
      onOpenChange(!isOpenRef.current);
    };

    shadowRoot.addEventListener('pointerup', onPointerUp as EventListener);
    shadowRoot.addEventListener('keydown', onKeyDown as EventListener);
    return () => {
      shadowRoot.removeEventListener('pointerup', onPointerUp as EventListener);
      shadowRoot.removeEventListener('keydown', onKeyDown as EventListener);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mousePointerUp (derived from stable mode) and onOpenChange are stable

  // When open, close on outside click via dual shadow-root and document listeners
  useEffect(() => {
    if (!isOpen) return;

    const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
    if (!shadowRoot || !('host' in shadowRoot)) return;

    const onShadowPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) {
        // MenuTrigger + mouse: close on pointerdown because onPressStart is a no-op
        // when already open (useControlledState suppresses the duplicate call)
        // DialogTrigger and touch/pen: the always-on pointerup handler toggles instead
        if (
          !mousePointerUp &&
          e.pointerType !== 'touch' &&
          e.pointerType !== 'pen'
        ) {
          onOpenChange(false);
        }
        return;
      }
      if (overlayRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    // At document level, shadow events are retargeted to the shadow host — only
    // close when the pointer genuinely came from outside the toolbar
    const onDocumentPointerDown = (e: PointerEvent) => {
      if (shadowRoot.host.contains(e.target as Node)) return;
      onOpenChange(false);
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
  }, [isOpen, mousePointerUp, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
    if (!shadowRoot || !('host' in shadowRoot)) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (mode === 'menu') {
        e.preventDefault();
        return;
      }

      // Popover: trap focus within the overlay
      const overlay = overlayRef.current;
      if (!overlay) return;
      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.closest('[aria-hidden="true"]'));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = shadowRoot.activeElement as HTMLElement | null;

      if (!overlay.contains(active)) return;

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    shadowRoot.addEventListener('keydown', onKeyDown as EventListener);
    return () =>
      shadowRoot.removeEventListener('keydown', onKeyDown as EventListener);
  }, [isOpen, mode, overlayRef, triggerRef]);

  // Move focus into the overlay after it opens, using aria-controls to target
  // the exact element rather than a generic class/structure query
  useLayoutEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
      if (!shadowRoot || !('host' in shadowRoot)) return;

      const overlayId = triggerRef.current?.getAttribute('aria-controls');
      if (overlayId) shadowRoot.getElementById(overlayId)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, triggerRef]);

  return { isOpen, onOpenChange, triggerRef, overlayRef };
}
