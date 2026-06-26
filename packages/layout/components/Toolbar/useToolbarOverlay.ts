/**
 * useToolbarOverlay — UNUSED in the no-Shadow-DOM architecture.
 *
 * This hook was a collection of workarounds for React Aria running inside a
 * Shadow DOM: event retargeting, outside-click detection, Tab trapping, focus
 * management. Without Shadow DOM all of that is handled natively by RAC.
 *
 * Kept for reference only. Safe to delete once the no-shadow-DOM approach is
 * confirmed.
 */

// import {
//   useCallback,
//   useEffect,
//   useLayoutEffect,
//   useRef,
//   useState,
// } from 'react';
//
// export function useToolbarOverlay(mode: 'menu' | 'popover' = 'menu') {
//   const mousePointerUp = mode === 'popover';
//   const [isOpen, setIsOpen] = useState(false);
//   const triggerRef = useRef<HTMLButtonElement | null>(null);
//   const overlayRef = useRef<HTMLElement | null>(null);
//   const isOpenRef = useRef(false);
//
//   const onOpenChange = useCallback((open: boolean) => {
//     isOpenRef.current = open;
//     setIsOpen(open);
//     if (!open) triggerRef.current?.focus();
//   }, []);
//
//   useLayoutEffect(() => {
//     isOpenRef.current = isOpen;
//   });
//
//   // Native pointerup/keydown listeners — RAC's usePress is broken in shadow DOM
//   // due to event retargeting at document level.
//   useEffect(() => {
//     const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
//     if (!shadowRoot || !('host' in shadowRoot)) return;
//     const onPointerUp = (e: PointerEvent) => {
//       if (!triggerRef.current?.contains(e.target as Node)) return;
//       if (!mousePointerUp && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
//       onOpenChange(!isOpenRef.current);
//     };
//     const onKeyDown = (e: KeyboardEvent) => {
//       if (!mousePointerUp) return;
//       if (!triggerRef.current?.contains(e.target as Node)) return;
//       if (e.key !== 'Enter' && e.key !== ' ') return;
//       if (e.key === ' ') e.preventDefault();
//       onOpenChange(!isOpenRef.current);
//     };
//     shadowRoot.addEventListener('pointerup', onPointerUp as EventListener);
//     shadowRoot.addEventListener('keydown', onKeyDown as EventListener);
//     return () => {
//       shadowRoot.removeEventListener('pointerup', onPointerUp as EventListener);
//       shadowRoot.removeEventListener('keydown', onKeyDown as EventListener);
//     };
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps
//
//   // Outside-click via dual shadow-root + document listeners.
//   useEffect(() => {
//     if (!isOpen) return;
//     const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
//     if (!shadowRoot || !('host' in shadowRoot)) return;
//     const onShadowPointerDown = (e: PointerEvent) => {
//       const target = e.target as Node;
//       if (triggerRef.current?.contains(target)) {
//         if (!mousePointerUp && e.pointerType !== 'touch' && e.pointerType !== 'pen') onOpenChange(false);
//         return;
//       }
//       if (overlayRef.current?.contains(target)) return;
//       onOpenChange(false);
//     };
//     const onDocumentPointerDown = (e: PointerEvent) => {
//       if (shadowRoot.host.contains(e.target as Node)) return;
//       onOpenChange(false);
//     };
//     shadowRoot.addEventListener('pointerdown', onShadowPointerDown as EventListener);
//     document.addEventListener('pointerdown', onDocumentPointerDown as EventListener);
//     return () => {
//       shadowRoot.removeEventListener('pointerdown', onShadowPointerDown as EventListener);
//       document.removeEventListener('pointerdown', onDocumentPointerDown as EventListener);
//     };
//   }, [isOpen, mousePointerUp, onOpenChange]);
//
//   // Tab trap / focus cycle for menu (block Tab) and popover (cycle within overlay).
//   useEffect(() => {
//     if (!isOpen) return;
//     const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
//     if (!shadowRoot || !('host' in shadowRoot)) return;
//     const onKeyDown = (e: KeyboardEvent) => {
//       if (e.key !== 'Tab') return;
//       if (mode === 'menu') { e.preventDefault(); return; }
//       const overlay = overlayRef.current;
//       if (!overlay) return;
//       const focusable = Array.from(
//         overlay.querySelectorAll<HTMLElement>(
//           'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
//         ),
//       ).filter((el) => !el.closest('[aria-hidden="true"]'));
//       if (!focusable.length) return;
//       const first = focusable[0];
//       const last = focusable[focusable.length - 1];
//       const active = shadowRoot.activeElement as HTMLElement | null;
//       if (!overlay.contains(active)) return;
//       if (e.shiftKey) { if (active === first) { e.preventDefault(); last.focus(); } }
//       else { if (active === last) { e.preventDefault(); first.focus(); } }
//     };
//     shadowRoot.addEventListener('keydown', onKeyDown as EventListener);
//     return () => shadowRoot.removeEventListener('keydown', onKeyDown as EventListener);
//   }, [isOpen, mode, overlayRef, triggerRef]);
//
//   // Move focus into the overlay on open.
//   useLayoutEffect(() => {
//     if (!isOpen) return;
//     const frame = requestAnimationFrame(() => {
//       const shadowRoot = triggerRef.current?.getRootNode() as ShadowRoot | null;
//       if (!shadowRoot || !('host' in shadowRoot)) return;
//       const overlayId = triggerRef.current?.getAttribute('aria-controls');
//       if (overlayId) shadowRoot.getElementById(overlayId)?.focus();
//     });
//     return () => cancelAnimationFrame(frame);
//   }, [isOpen, triggerRef]);
//
//   return { isOpen, onOpenChange, triggerRef, overlayRef };
// }
