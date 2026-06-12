/**
 * A Menu component designed for use inside the Toolbar's shadow DOM.
 *
 * React Aria's Popover uses FocusScope and useInteractOutside, which rely on
 * `document.activeElement`. Inside a shadow DOM, `document.activeElement`
 * returns the shadow host element rather than the actual focused element,
 * breaking focus containment and outside-click detection.
 *
 * All shadow DOM workarounds (open/close state, outside-click detection,
 * Tab trapping, focus-on-open, focus-restore-on-close) are handled by
 * `useToolbarOverlay`. This component sets `isNonModal` on the Popover to
 * disable React Aria's own FocusScope containment, which conflicts with those
 * workarounds.
 *
 * Usage is identical to the base Menu component. Pass custom CSS via the
 * `styles` prop (imported with `?inline`) — it will be injected into the
 * shadow root automatically:
 *
 *   import menuStyles from './MyMenu.css?inline';
 *
 *   <ToolbarMenu icon={<MyIcon />} className="my-menu" styles={menuStyles}>
 *     <MenuItem href="/foo">Foo</MenuItem>
 *   </ToolbarMenu>
 */

import React from 'react';
import { type ComponentProps } from 'react';
import { Button } from 'react-aria-components';
import { MenuTrigger } from '@plone/components';
import { useToolbarOverlay } from './useToolbarOverlay';

export interface ToolbarMenuProps extends ComponentProps<typeof MenuTrigger> {
  icon?: React.ReactNode;
  /** CSS string (imported with `?inline`) to inject into the shadow root. */
  styles?: string;
}

export function ToolbarMenu({
  icon,
  styles,
  children,
  ...props
}: ToolbarMenuProps) {
  const { isOpen, onOpenChange, triggerRef, overlayRef } = useToolbarOverlay();

  return (
    <>
      {styles && <style>{styles}</style>}
      <MenuTrigger
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isNonModal={true}
        popoverRef={overlayRef}
        {...props}
      >
        <Button ref={triggerRef}>{icon}</Button>
        {children}
      </MenuTrigger>
    </>
  );
}
